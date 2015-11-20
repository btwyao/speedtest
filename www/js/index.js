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
    SpeedTest: ['172.16.101.220', 2046],
    UploadData: ['172.16.101.220', 2048],
};

var waitForTestSpeedMsg = false;
var sendTestSpeedMsgTime = 0;

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
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        window.tlantic.plugins.socket.receive = this.onSocketReceive;
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        log('Received Event: ' + id);
    },

    onDestroy: function() {
        document.removeEventListener('backbutton', app.onDestroy, false);
        window.tlantic.plugins.socket.disconnectAll();
    },

    onSocketReceive: function(host, port, id, data) {
        if (connectionMap[id] == 'SpeedTest' && waitForTestSpeedMsg) {
            waitForTestSpeedMsg = false;
            var date = new Date();
            log(id, 'received,delay:', date.getTime()-sendTestSpeedMsgTime, ',msg:', data);
        }
    },

    connect: function(name, nextFunc) {
        var socket = window.tlantic.plugins.socket;
        socket.connect(function(connectionId) {
            log(connectionId, 'server connected!!!');
            connectionMap[name] = connectionId;
            connectionMap[connectionId] = name;
            nextFunc(true);
        }, function() {
            log(connectionId, 'server connect failed!!!');
            nextFunc(false);
        }, hostMap[name][0], hostMap[name][1]);
    },

    speedTest: function() {
        log('speed test!!!');
        var socket = window.tlantic.plugins.socket;
        var newConnection = function(nextFunc) {
            app.connect('SpeedTest', function(ok) {
                if (ok) {
                    nextFunc();
                } else {
                    log('connect to speed server failed!!!');
                }
            });
        };
        var sendMsg = function() {
            if (waitForTestSpeedMsg) {
                log('Already send to speed test server, wait!!!');
                return;
            }
            socket.send(function() {
                waitForTestSpeedMsg = true;
                log('msg send!!!');
                var date = new Date();
                sendTestSpeedMsgTime = date.getTime();
            }, function() {
                log('msg send failed!!!', connectionMap['SpeedTest']);
            }, connectionMap['SpeedTest'], 'hello');
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
            }, function() {
                log('check connection to speed server failed!!!');
            });
        }
    },

    collectData: function() {
        var data = {};
        data['NetworkState'] = navigator.connection.type;
        return data;
    },

    uploadTestData: function(networkState, delay) {
        var socket = window.tlantic.plugins.socket;
        socket.connect(function(connectionId) {
            log(connectionId, 'server connected!!!');
            socket.send(function() {
                log(connectionId, 'msg send!!!');
            }, function() {
            }, connectionId, networkState + ',' + delay);
        }, function() {
            log(connectionId, 'server connect failed!!!');
        }, '172.16.101.220', 2048);
    },
};
