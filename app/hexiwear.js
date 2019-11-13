"use strict";

var Hexiwear = function () {

    /* Defining UUIDs for services and characteristics */
    var DEVICE_INFORMATION_SERVICE = "0000180a-0000-1000-8000-00805f9b34fb";
    var MANUFACTURER_NAME = "00002a29-0000-1000-8000-00805f9b34fb";

    var MOTION_SERVICE = "00002000-0000-1000-8000-00805f9b34fb";
    var ACCELEROMETER = "00002001-0000-1000-8000-00805f9b34fb";
	//here
    var HEART_RATE = "00002021-0000-1000-8000-00805f9b34fb";
    var BATTERY = "00002a19-0000-1000-8000-00805f9b34fb";

    
    var DEVICE_NAME = 'HEXIWEAR';

    var self;

    function Hexiwear(bluetooth) {
        self = this;
        self.bluetooth = bluetooth;
        self.initialize();
    }

    /* Initializing properties for Hexiwear class */
    Hexiwear.prototype.initialize = function () {
        self = this;
        self.bluetoothDevice = undefined;
        self.connected=false;
        self.deviceInformationService = undefined;
        self.motionService = undefined;
        self.motionData = {};
        self.name = undefined;
        self.id = undefined;
        self.manufacturerName = undefined;
    };

    /* Defining function for connecting to the device */
    Hexiwear.prototype.connect = function () {
        let options = {
        	filters: [{name: DEVICE_NAME}],
        	optionalServices: [
        		DEVICE_INFORMATION_SERVICE,
        		MOTION_SERVICE
        	]
        };
        
        return navigator.bluetooth.requestDevice(options)
        /* Connecting to the device */
            .then(function (device) {
                self.bluetoothDevice = device;
                self.name = device.name;
                self.id = device.uuid; 
                return device.gatt.connect();
            })
            .then(function (server) {
                self.connected = true;
                
                console.log("Discovering services");
                
                /* Getting primary services */
                return Promise.all([
                    /* Getting device information data service */
                    server.getPrimaryService(DEVICE_INFORMATION_SERVICE)
                        .then(function (service) {
                            self.deviceInformationService = service;
                            self.readDeviceInformation();
                         }),
                    /* Getting motion data service */
                    server.getPrimaryService(MOTION_SERVICE)
                        .then(function (service) {
                        	self.motionService = service;
							self.readMotion();
                        })
                ]);
                /* Error handling function */
            }, function (error) {
                console.warn('Service not found'+error);
                Promise.resolve(true);
            })
    };

	/* ------- Hexiwear Handling Functions ------- */
	
	Hexiwear.prototype.readDeviceInformation = function() {
		if (self.deviceInformationService) {
			self.deviceInformationService.getCharacteristic(MANUFACTURER_NAME)
            	.then(function(characteristic) {
              		// Got characteristic.
                	// Read the value we want.
               		return characteristic.readValue();
            	})
            	.then(function(data) {
                	/* Parsing characteristic readout */
                	self.manufacturerName = dataToString(data);
                	console.log("Got data: " + self.manufacturerName);
               		self.updateUI();
            	})
            	.catch(function(error) {
             		console.log('Reading device info data failed. Error: ' + JSON.stringify(error));
         		});
		}
	}
	
	Hexiwear.prototype.readMotion = function() {
		if (self.motionService) {
			self.motionService.getCharacteristic(ACCELEROMETER)
				.then(function(characteristic) {
                	// Got characteristic.
               		// Read the value we want.
                	return characteristic.readValue();
            	})
            	.then(function(data) {
                 	self.motionData.x = data.getInt16(0, true) / 100;
                   	self.motionData.y = data.getInt16(2, true) / 100;
                  	self.motionData.z = data.getInt16(4, true) / 100;
                   	self.updateUI();
            	})
           		.catch(function(error) {
                	console.log('Reading motion data failed. Error: ' + JSON.stringify(error));
            	});
			//HR
            self.motionService.getCharacteristic(HEART_RATE)
            .then(function(characteristic){
                return characteristic.readValue();
            })
            .then(function(data){
                self.motionData.hr = data.getInt16;
            })
            .catch(function(error){
                console.log('reading motion data failed .Error: ' + JSON-stringify(error));
            });
            //Battery level
            self.motionService.getCharacteristic(BATTERY)
            .then(function(characteristic){
                return characteristic.readValue();
            })
            .then(function(data){
                self.motionData.btt = data.getInt16;
            })
            .catch(function(error){
                console.log('reading motion data failed .Error: ' + JSON-stringify(error));
            });
		}
	}

    /* Refresh function for updating data */
    Hexiwear.prototype.refreshValues = function() {
        if (self.motionService){
            self.readMotion(self.motionService);
        }

    };
    
	function dataToString(data) {
        var value = '';

        for (var i = 0; i < data.byteLength; i++) {
            value = value + String.fromCharCode(data.getUint8(i));
        }

        value = value.replace(/\0/g, '');
        return value.trim();
    }

    window.hexiwear = new Hexiwear();
}();
