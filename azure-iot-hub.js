const fs = require('fs');
const Protocol = require('azure-iot-device-mqtt').Mqtt;
const Client = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;

const connectCallback = function (err) {
  if (err) {
    console.error('Could not connect: ' + err.message);
  } else {
    console.log('Client connected');
    client.on('message', function (msg) {
      console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
      client.complete(msg, printResultFor('completed'));
    });
    client.on('error', function (err) {
      console.error(err.message);
    });
    client.on('disconnect', function () {
      clearInterval(sendInterval);
      client.removeAllListeners();
      client.open(connectCallback);
    });
  }
}
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.constructor.name);
  };
}
let client;
module.exports = function(RED) {
  function AzureIoTHub(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const connectionString = 'HostName=' + config.hostname + ';DeviceId=' + config.deviceid + ';SharedAccessKey=' + config.sharedaccesskey;
    const edge_ca_cert_path = config.edgecacertpath;
    console.log("Connection string: " + connectionString);
    client = Client.fromConnectionString(connectionString, Protocol);
    const options = {
      ca : fs.readFileSync(edge_ca_cert_path, 'utf-8'),
    };
    client.setOptions(options, function(err) {
      if (err) {
        console.log('SetOptions Error: ' + err);
      } else {
        client.open(connectCallback);
      }
    });

    node.on('input', function(msg) {
      var data = JSON.stringify(msg);
      var message = new Message(data);
      client.sendEvent(message, printResultFor('send'));
    });
  }
  RED.nodes.registerType("Azure IoT Hub out", AzureIoTHub);
}
