/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var connectionMap = {};
var hostMap = {
    SpeedTest: ['112.74.193.129', 2046],
    UploadData: ['112.74.193.129', 2048],
};

var speedTestMsg = "hello"
for (var i=0; i<50; i++) {
    speedTestMsg = speedTestMsg + "hello";
}

var sendTestSpeedMsgTime = 0;
var speedTestCnt = 0;
var maxSpeedTestCnt = 20;
var delayList = new Array();

var log = function() {
    var params = "";
    for (var i=0; i<arguments.length; i++) {
        params = params + " " + arguments[i];
    }
    var date = new Date();
    // params = date.toUTCString() + ':' + params;
    console.log(params);
    var element = document.getElementById("log");
    element.value = element.value + params + "\n";
};

var app = {
    // Application Constructor
    initialize: function() {
        // window.location.href = "http://172.16.101.220:3000/speedtest.html";
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('backbutton', this.onDestroy, false);
    },
    // deviceready Event Handler
    onDeviceReady: function() {
        app.receivedEvent("准备就绪");
        window.tlantic.plugins.socket.receive = app.onSocketReceive;
        app.connect('SpeedTest', function(ok) {
        });
        app.connect('UploadData', function(ok) {
        });
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById('speedtest');
        var listeningElement = parentElement.querySelector('.listening');
        listeningElement.firstChild.nodeValue = id;
    },

    onDestroy: function() {
        document.removeEventListener('backbutton', app.onDestroy, false);
        var func = function() {};
        window.tlantic.plugins.socket.disconnect(func,func,connectionMap["UploadData"]);
        window.tlantic.plugins.socket.disconnect(func,func,connectionMap["SpeedTest"]);
        navigator.app.exitApp();
    },

    onSocketReceive: function(host, port, id, data) {
        if (connectionMap[id] == 'SpeedTest') {
            var date = new Date();
            var delay = date.getTime()-sendTestSpeedMsgTime;
            log(id, 'received,delay:', delay);
            speedTestCnt += 1;
            delayList.push(delay);
            if (speedTestCnt >= maxSpeedTestCnt) {
                speedTestCnt = 0;
                var length = delayList.length;
                var minDelay, avrDelay, maxDelay;
                minDelay=avrDelay=maxDelay=delayList[0];
                for (var i=0;i<length;i++) {
                    var delay = delayList.pop();
                    avrDelay+=delay;
                    if (delay < minDelay)
                        minDelay = delay;
                    if (delay > maxDelay)
                        maxDelay = delay;
                }
                avrDelay/=length;
                var networkState = navigator.connection.type;
                var envElement = document.getElementById("selectenv");
                var env = envElement.options[envElement.selectedIndex].getAttribute("value");
                var testMsg = "测速结果：平均"+avrDelay+"ms,最高"+maxDelay+"ms,最低"+minDelay+"ms("+networkState+")";
                app.receivedEvent(testMsg);
                app.uploadTestData(networkState, avrDelay, env);
            } else {
                app.speedTestCore();
            }
        }
    },

    connect: function(name, nextFunc) {
        var socket = window.tlantic.plugins.socket;
        socket.connect(function(connectionId) {
            socket.isConnected(connectionId, function(ok) {
                if (ok) {
                    connectionMap[name] = connectionId;
                    connectionMap[connectionId] = name;
                    nextFunc(true);
                } else {
                    nextFunc(false);
                }
            }, function(errMsg) {
                log('check connection to server failed!!!'+errMsg);
                nextFunc(false);
            });
        }, function(errMsg) {
            log(connectionId, 'server connect failed!!!'+errMsg);
            nextFunc(false);
        }, hostMap[name][0], hostMap[name][1]);
    },

    speedTest: function() {
        log('speed test!!!');
        if (speedTestCnt > 0) {
            app.receivedEvent("正在测速，请稍等");
            return;
        }
        app.speedTestCore();
    },

    speedTestCore: function() {
        var socket = window.tlantic.plugins.socket;
        var newConnection = function(nextFunc) {
            app.connect('SpeedTest', function(ok) {
                if (ok) {
                    nextFunc();
                } else {
                    app.receivedEvent("测速服务器连接失败");
                    log('connect to speed server failed!!!');
                }
            });
        };
        var sendMsg = function() {
            log('msg send!!!');
            var date = new Date();
            sendTestSpeedMsgTime = date.getTime();
            socket.send(function() {
            }, function(errMsg) {
                app.receivedEvent("测速失败，请重试");
                log('msg send failed!!!'+errMsg, connectionMap['SpeedTest']);
            }, connectionMap['SpeedTest'], speedTestMsg);
        };
        if (!connectionMap['SpeedTest']) {
            newConnection(sendMsg);
        } else {
            socket.isConnected(connectionMap['SpeedTest'], function(ok) {
                if (!ok) {
                    newConnection(sendMsg);
                } else {
                    sendMsg();
                }
            }, function(errMsg) {
                app.receivedEvent("测试服务器网络异常");
                log('check connection to speed server failed!!!');
            });
        }
    },

    uploadTestData: function(networkState, delay, env) {
        var testMsg = "本次测速结果："+delay+"ms("+networkState+")";
        log('upload data!!!');
        var socket = window.tlantic.plugins.socket;
        var newConnection = function(nextFunc) {
            app.connect('UploadData', function(ok) {
                if (ok) {
                    nextFunc();
                } else {
                    app.receivedEvent("数据收集服务器连接失败，"+testMsg);
                    log('connect to data server failed!!!');
                }
            });
        };
        var sendMsg = function() {
            socket.send(function() {
                log('data upload!!!');
            }, function() {
                app.receivedEvent("测试数据上传失败，"+testMsg);
                log('data upload failed!!!', connectionMap['UploadData']);
            }, connectionMap['UploadData'], networkState + ',' + delay + ',' + env);
        };
        if (!connectionMap['UploadData']) {
            newConnection(sendMsg);
        } else {
            socket.isConnected(connectionMap['UploadData'], function(ok) {
                if (!ok) {
                    newConnection(sendMsg);
                } else {
                    sendMsg();
                }
            }, function() {
                app.receivedEvent("数据收集服务器网络异常，"+testMsg);
                log('check connection to data server failed!!!');
            });
        }
    },
};
