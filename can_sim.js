
let partNum = 0;

let running = false;
let requestInt = undefined; 


class Bus {
    constructor(){
        console.log("start");
        this.componentsConnected = {"feather": true, "pi": true, "rpm1": true, "rpm2": true, "joystick": true,
                            "potentiometer": true, "steerActuator": true, "throttleActuator": true};

        this.joystickPosition = [0,0]; // -100 to +100 each
        this.joystickButtons = {"grip": false, "red": false, "black": false, "blue": false, "wheelUp": false, "wheelDown": false};
        this.lastLength = 0;
        this.messages = [];
        this.messagesShow = [];
        this.potValue=0; // 0 - 100
        this.actuatorPosition=0; // 0 to 100
        this.throttlePosition=0; // 0 to 222
        this.rpm1 = 0;
        this.rpm2 = 0;
        this.positionSteering = true;
        this.throttleMultiplier = 1;
        this.targetThrottleRaw = 0;
        this.joystickZeroed = false;
        this.redPressed = false;

        this.piControl = false;

        this.lastSendTimes = {"feather": Date.now(), "pi": Date.now(), "joystick": Date.now(), "throttleActuator": Date.now()};
    }

    update() {
        const newMessages = [];

        this.componentsConnected = {"feather": document.getElementById("featherConnected").checked, "pi": document.getElementById("piConnected").checked, 
                            "rpm1": document.getElementById("rpm1Connected").checked, "rpm2": document.getElementById("rpm1Connected").checked, "joystick": document.getElementById("joystickConnected").checked,
                            "potentiometer": document.getElementById("potConnected").checked, "steerActuator": document.getElementById("steerConnected").checked, "throttleActuator": document.getElementById("throttleConnected").checked};

        this.joystickPosition = [+document.getElementById("xPos").value, +document.getElementById("yPos").value]; // -100 to +100 each
        // console.log(this.joystickPosition)
        this.joystickButtons = {"grip": document.getElementById("grip").checked, "red": document.getElementById("red").checked, "black": document.getElementById("black").checked, "blue": document.getElementById("blue").checked, "wheelUp": false, "wheelDown": false};


        if (this.componentsConnected["feather"]) {
            if (Date.now() - this.lastSendTimes["feather"] > 70) {
                if (this.componentsConnected["joystick"]){
                    if (this.joystickButtons["black"]) {this.throttleMultiplier=1;}
                    if (this.joystickButtons["blue"]) {this.throttleMultiplier=0.5;}
                    if (this.joystickButtons["red"]) {this.redPressed = true;}
                    if (this.joystickButtons["grip"] && this.joystickPosition[1] <=50){
                        this.joystickZeroed = true;
                    } else if (this.joystickButtons["grip"] && this.joystickZeroed){
                        this.targetThrottleRaw = (this.joystickPosition[1]-50)*2;
                    } else if (!this.joystickButtons["grip"]) {
                        this.joystickZeroed = false;
                        if (this.joystickPosition[1] <= 50){
                            this.targetThrottleRaw = 0;
                        }
                    }
                    if (this.redPressed && !this.joystickButtons["red"]){
                        this.redPressed = false;
                        this.positionSteering = !this.positionSteering
                    }
                }

                const targetThrottle = (100-this.targetThrottleRaw)*this.throttleMultiplier*40
                newMessages.push([Date.now(), 0xCF01A00, Math.floor(targetThrottle%256), Math.floor(targetThrottle/256), 0, 0, 0, 0, 0, 0]) // 0xCF01A00
                
                if (this.componentsConnected["potentiometer"]) { // sensor 3210123
                    this.potValue=this.actuatorPosition;
                    let val = Math.floor(this.potValue * 65.535);
                    const isPosSteering = this.positionSteering ? 1 : 0;
                    newMessages.push([Date.now(), 3210123, 0, Math.floor(val%256), Math.floor(val/256), isPosSteering, 0, 0, 0, 0]);
                } else {
                    this.potValue=this.actuatorPosition;
                    let val = Math.floor(80 * 65.535);
                    const isPosSteering = this.positionSteering ? 1 : 0;
                    newMessages.push([Date.now(), 3210123, 0, Math.floor(val%256), Math.floor(val/256), isPosSteering, 0, 0, 0, 0]);
                }
                document.getElementById("potentiometer").innerHTML = Math.floor(this.actuatorPosition) + "%"

                if (this.componentsConnected["steerActuator"]){
                    if (this.positionSteering){
                        this.actuatorPosition = (this.actuatorPosition + this.joystickPosition[0])/2;
                    } else {
                        this.actuatorPosition = Math.max(0, Math.min(100, this.actuatorPosition+(this.joystickPosition[0]-50)/10));
                    }
                    document.getElementById("steer").innerHTML = Math.floor(this.actuatorPosition) + "%";
                }

                if (this.componentsConnected["rpm1"]){
                    let val = Math.floor(this.rpm1 * 65.535);
                    newMessages.push([Date.now(), 3210123, 1, Math.floor(val%256), Math.floor(val/256), 0, 0, 0, 0, 0]);
                } else {
                    const val = 0;
                    newMessages.push([Date.now(), 3210123, 1, Math.floor(val%256), Math.floor(val/256), 0, 0, 0, 0, 0]);
                }
                document.getElementById("rpm1").innerHTML = Math.floor(this.rpm1) + " rpm";

                if (this.componentsConnected["rpm2"]){
                    let val = Math.floor(this.rpm2 * 65.535);
                    newMessages.push([Date.now(), 3210123, 2, Math.floor(val%256), Math.floor(val/256), 0, 0, 0, 0, 0]);
                } else {
                    const val = 0;
                    newMessages.push([Date.now(), 3210123, 2, Math.floor(val%256), Math.floor(val/256), 0, 0, 0, 0, 0]);
                }
                document.getElementById("rpm2").innerHTML = Math.floor(this.rpm2) + " rpm";


                if (this.positionSteering) {
                    const target_steer_pos = Math.floor(Math.max(0, Math.min(100, 100 - ((this.joystickPosition[0] + 100) / 2) )));
                    newMessages.push([Date.now(), 1230321, target_steer_pos%256, Math.floor(target_steer_pos/256), 1, 0, 0, 0, 0, 0]); // steer command
                } else {
                    let target_steer_dir = 65535/2;
                    if (this.joystickPosition[0] > 0) {target_steer_dir=65535;}
                    if (this.joystickPosition[0] < 0) {target_steer_dir=0;}
                    newMessages.push([Date.now(), 1230321, target_steer_dir%256, Math.floor(target_steer_dir/256), 0, 0, 0, 0, 0, 0]); // steer command
                }

                newMessages.push([Date.now(), 12345, 1, 123, 123, 1, 0, 0, 0, 0]); // 12345 presence


                this.lastSendTimes["feather"] = Date.now();
            }
        }
        if (this.componentsConnected["joystick"]){
            if (Date.now() - this.lastSendTimes["joystick"] > 100) {
                const msg = [Date.now(), 217962035, 0, 0, 0, 0, 0, 0, 0, 0]; // 217962035
                // this.joystickPosition = [25, 25]
                const xPos = this.joystickPosition[0]; // -100 to 100
                const yPos = this.joystickPosition[1]; // -100 to 100

                let xSignFlag = (xPos >= 0) ? 16 : 4;
                let xBaseValue = Math.abs(xPos);
                msg[3] = Math.floor(xBaseValue / 4);
                msg[2] = (xBaseValue % 4) * 64 + xSignFlag;

                let ySignFlag = (yPos >= 0) ? 16 : 4;
                let yBaseValue = Math.abs(yPos);
                msg[5] = Math.floor(yBaseValue / 4);
                msg[4] = (yBaseValue % 4) * 64 + ySignFlag;

                msg[7] = (this.joystickButtons["red"] ? 16 : 0) +
                     (this.joystickButtons["blue"] ? 64 : 0) +
                     (this.joystickButtons["wheelUp"] ? 4 : 0) +
                     (this.joystickButtons["wheelDown"] ? 1 : 0);

                // Encode row[8] (corresponds to Python's row[2+6])
                msg[8] = (this.joystickButtons["black"] ? 64 : 0) +
                         (this.joystickButtons["grip"] ? 1 : 0);

                newMessages.push(msg);
                this.lastSendTimes["joystick"] = Date.now();

            }
        }
        if (this.componentsConnected["throttleActuator"]){
            if (Date.now() - this.lastSendTimes["throttleActuator"] > 100) {
                const msg = [Date.now(), 419361298, 255, 255, 255, 255, 255, 255, 255, 255]; //419361298
                this.throttlePosition = (this.targetThrottleRaw*2.55 + this.throttlePosition)/2
                msg[8] = Math.floor(this.throttlePosition)
                this.rpm1 = 32 * (this.throttlePosition*80+20) * this.throttleMultiplier;
                this.rpm2 = 32 * (this.throttlePosition*80+20) / 3 * this.throttleMultiplier;
                newMessages.push(msg);
                this.lastSendTimes["throttleActuator"] = Date.now();
                document.getElementById("throttle").innerHTML = Math.floor(this.throttlePosition/2.55) + "%"
            }
        }

 

        if (this.componentsConnected["pi"]){
            if (Date.now() - this.lastSendTimes["pi"] > 1000) {
                // newMessages.push([Date.now(), "pi", 1,2,3,4,5,6,7,8]);
                this.lastSendTimes["pi"] = Date.now();
            }
        }

        this.updateTable(newMessages);
    }

    updateTable(newMessages) {
        const tableBody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
        for (const m of newMessages){
            const id = document.getElementById("filter").value;
            if (id.length > 0){
                if (m[1] != id && m[1].toString(16).padStart(8, '0') != id) {
                    continue;
                }
            }
            
            const newRow = tableBody.insertRow(0);

            for (let i = 0; i < m.length; i++) {
                const cell = newRow.insertCell(i);
                if (document.getElementById("hex").checked) {
                    if (i==0){
                        cell.textContent = m[i];
                    } else if (i==1){
                        cell.textContent = "0x" + m[i].toString(16).padStart(8, '0');
                    } else {
                        cell.textContent = "0x" + m[i].toString(16).padStart(2, '0');
                    }
                } else {
                    cell.textContent = m[i];
                }
            }

            if (tableBody.rows.length > 20) {
                tableBody.deleteRow(tableBody.rows.length - 1);
            }

        }
    }
}


let bus = new Bus();


document.getElementById("run").onclick = function updateRun() {
    if (document.getElementById("run").value == "Run"){
        document.getElementById("run").value = "Pause";
        requestInt = setInterval(bus.update.bind(bus), 50);
    } else {
        clearInterval(requestInt);
        document.getElementById("run").value = "Run";
    }
}


function handleMouseMove(event) {

    if (document.pointerLockElement === document.body){


        const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const deltaY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        rotationY -= deltaX * sensitivity; 
        rotationX -= deltaY * sensitivity;

        rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));

        // console.log(rotationX, rotationY);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
        const pitchQuaternion = new THREE.Quaternion();
        pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationX);
        quaternion.multiply(pitchQuaternion);
        camera.quaternion.copy(quaternion);

    }
}

function handleClick(event){
    console.log(document.body)
    const element = document.body;
    if (document.pointerLockElement !== element)  {
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();
        return;
    }
}



