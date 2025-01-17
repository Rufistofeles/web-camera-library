/**
 * <p>Features of the Image Capture Library</p>
 * <ul>
 *     <ol>Camera invocation support: User and Environment</ol>
 *     <ol>Switch camera option for mobile device</ol>
 *     <ol>Select attached camera option for laptop and desktop</ol>
 *     <ol>Configurable timer</ol>
 *     <ol>Retake image feature</ol>
 *     <ol>Custom class support for design</ol>
 *     <ol>Support for callback function</ol>
 * </ul>
 *
 * @author Mayank Chauhan
 * @email mkc110891@gmail.com
 */

(function ($) {

    $.fn.customWebCam = function (options) {

        /**
         * Default Options
         * @type {{}}
         */
        let defaults = {
            videoClass: [],
            canvasClass: [],
            captureButtonClass: [],
            retakeButtonClass: [],
            okButtonClass: [],
            actionButtonWrapperClass: [],
            countdownClass: [],
            selectClass: [],
            showHideCameraDropdownButtonClass: [],
            SwitchCameraIconClass: [],
            canvasWidth: "100%",
            facingMode: "user",
            callbackFunction: null,
            captureTimeoutInSeconds: 5
        };

        // Get instance
        let plugin = this;

        // Current Media Stream
        let $currentStream;

        // Video devices
        let $devices = [];

        // Video capture container
        let $captureImageWrapper;

        // Canvas preview container
        let $canvasImageWrapper;

        // Video element
        let $video;

        // Canvas to show captured image
        let $canvas;

        // Image capture button
        let $captureButton;

        // Retake camera button
        let $retakeButton;

        // Ok camera button
        let $okCameraButton;

        // Facing mode - environment | user
        let $facingMode;

        // Select camera dropdown
        let $selectCameraDropdown;

        // Current selected media
        let $currentSelectedMedia = 0;

        // Timer countdown
        let $countdownArea;

        // Switch Camera Icon
        let $switchCameraIcon;

        // Show hide camera dropdown button
        let $showHideCameraDropdownButton;

        // FacingMode

        // Supported constraints
        let $supportedConstraintsDefault = {
            aspectRatio: false,
            autoGainControl: false,
            brightness: false,
            channelCount: false,
            colorTemperature: false,
            contrast: false,
            deviceId: false,
            echoCancellation: false,
            exposureCompensation: false,
            exposureMode: false,
            exposureTime: false,
            facingMode: false,
            focusDistance: false,
            focusMode: false,
            frameRate: false,
            groupId: false,
            height: false,
            iso: false,
            latency: false,
            noiseSuppression: false,
            pan: false,
            pointsOfInterest: false,
            resizeMode: false,
            sampleRate: false,
            sampleSize: false,
            saturation: false,
            sharpness: false,
            tilt: false,
            torch: false,
            whiteBalanceMode: false,
            width: false,
            zoom: false
        };

        let $supportedConstraints = {};

        // Set empty settings
        plugin.settings = {};

        // Wrapper
        let $wrapper;
        
        plugin.init = function () {

            // Define settings
            plugin.settings = $.extend(plugin.settings, defaults, options);

            // Facing mode
            $facingMode = plugin.settings.facingMode.toString().toLowerCase();

            // Get supportedConstraints
            $supportedConstraints = $.extend($supportedConstraints, $supportedConstraintsDefault, getSupportedConstraints());

            plugin.each(async function (i, wrapper) {
                console.log("wrapper => ", wrapper);
                $(wrapper).addClass('camera-capture-container');
                $wrapper = $(wrapper);
                await getMedia();
                console.log("$devices ==>", $devices);

                // Create wrapper for capture image element
                $captureImageWrapper = $('<div>', {
                    class: 'video-capture-container'
                });

                // Create video element and append to wrapper
                $video = createVideoElement();
                $captureImageWrapper.append($video);

                $countdownArea = createCountdownArea().hide();
                $captureImageWrapper.append($countdownArea);

                // If number of devices are more than one, then show switch option and dropdown of select devices
                if (mobileAndTabletCheck()) {
                    // Switch camera icon
                    $switchCameraIcon = createSwitchCameraIcon();
                    $captureImageWrapper.append($switchCameraIcon);
                    $switchCameraIcon.on('click', flipCamera.bind());
                }

                $(wrapper).append($captureImageWrapper);

                // Create wrapper to preview captured image
                $canvasImageWrapper = $('<div>', {
                    class: 'canvas-image-container'
                });

                // Create canvas element and append to wrapper
                $canvas = createCanvasElement().hide();
                $canvasImageWrapper.append($canvas);
                $(wrapper).append($canvasImageWrapper);

                // Create capture button wrapper and append to wrapper
                let $actionButtonWrapperClass = plugin.settings.actionButtonWrapperClass;
                $actionButtonWrapperClass.push("camera-capture-buttons-wrapper");
                let $captureActionButtonWrapper = $('<div>', {
                    class: $actionButtonWrapperClass.join(" ")
                });

                // Hide button by default and show once camera is activated
                $captureButton = createCaptureButtonElement().hide();
                $captureActionButtonWrapper.append($captureButton);

                // Hide button by default and show once image is captured
                $retakeButton = createRetakeButtonElement().hide();
                $captureActionButtonWrapper.append($retakeButton);

                // Hide button by default and show once image is captured
                $okCameraButton = createOkButtonElement().hide();
                $captureActionButtonWrapper.append($okCameraButton);

                // If number of devices are more than one, then show switch option and dropdown of select devices
                if ($devices.length > 1 && !mobileAndTabletCheck()) {
                    $showHideCameraDropdownButton = createCameraDropdownToggleButton();
                    $captureActionButtonWrapper.append($showHideCameraDropdownButton);
                    $showHideCameraDropdownButton.on('click', toggleSelectCameraDropdown.bind());

                    $selectCameraDropdown = createSelectCameraDropdown().hide();
                    createMediaDropdown();
                    $captureActionButtonWrapper.append($selectCameraDropdown);
                    $selectCameraDropdown.on('change', changeCameraFromDropdown.bind());
                }

                // Add capture image button wrapper
                $(wrapper).append($captureActionButtonWrapper);

                // Get list of media devices that support video input
                if ($facingMode !== "" && ["user", "environment"].includes($facingMode)) {
                    await selectMediaStream();
                    startCamera();
                }
            });
        };

        // Create Video Tag
        let createVideoElement = function () {
            return $('<video>', {
                class: plugin.settings.videoClass.join(" "),
                width: plugin.settings.canvasWidth,
                playsinline: true,
                autoplay: "autoplay"
            });
        };

        let createCanvasElement = function () {
            return $('<canvas>', {
                class: plugin.settings.canvasClass.join(" "),
                width: plugin.settings.canvasWidth,
            });
        };

        let createCaptureButtonElement = function () {
            let $captureButtonClass = plugin.settings.captureButtonClass;
            $captureButtonClass.push("image-capture-button");
            return $('<button>', {
              class: $captureButtonClass.join(" "),
              text: "Tomar Foto"
            }).on('click', captureImage.bind());
        };

        let createRetakeButtonElement = function () {
            let $retakeButtonClass = plugin.settings.retakeButtonClass;
            $retakeButtonClass.push("image-retake-button btn btn-warning");
            return $('<button>', {
              class: $retakeButtonClass.join(" "),
              text: "Volver a Tomar"
            }).on('click', retakeImage.bind());
        };

        let createOkButtonElement = function () {
            let $okButtonClass = plugin.settings.okButtonClass;
            $okButtonClass.push("image-ok-button btn btn-success");
            return $('<button>', {
              class: $okButtonClass.join(" "),
              text: "OK"
            }).on('click', acceptImage.bind());
        };

        let createSelectCameraDropdown = function () {
            let $selectClass = plugin.settings.selectClass;
            $selectClass.push("camera-select-dropdown");
            return $('<select>', {
                class: $selectClass.join(" ")
            });
        };

        let createCountdownArea = function () {
            let $countdownClass = plugin.settings.countdownClass;
            $countdownClass.push("countdown-timer");
            return $('<div>', {
                class: $countdownClass.join(" ")
            });
        };

        let createSwitchCameraIcon = function () {
            let $switchCameraIconClass = plugin.settings.SwitchCameraIconClass;
            $switchCameraIconClass.push("switch-camera-icon");
            return $('<img>', {src: switchCameraImage, class: $switchCameraIconClass.join(" ")});
        };

        let createCameraDropdownToggleButton = function () {
            let $showHideCameraDropdownButtonClass = plugin.settings.showHideCameraDropdownButtonClass;
            $showHideCameraDropdownButtonClass.push("camera-toggle-button-icon");
            return $('<img>', { src: cameraDropdownToggleImage, class: $showHideCameraDropdownButtonClass.join(" ")});
        };

        let toggleSelectCameraDropdown = function () {
            $selectCameraDropdown.toggle();
        };

        let getSupportedConstraints = function () {
            return navigator.mediaDevices.getSupportedConstraints();
        };

        let getMedia = async function () {
            try {
                return await navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {filterDevices(mediaDevices)});
            } catch(e) {
                console.log("Error in fetching media => ", e);
            }
        };

        let filterDevices = function (mediaDevices) {
            console.log('mediaDevices ==>', mediaDevices);
            $devices = [];
            let count = 1;
            mediaDevices.forEach(mediaDevice => {
                if (mediaDevice.kind === 'videoinput') {
                    $devices.push(mediaDevice);
                }
            });
        };

        let createMediaDropdown = function () {
            $selectCameraDropdown.empty();
            $('<option>', {
                value: "",
                text: "Select device"
            }).appendTo($selectCameraDropdown);
            let count = 1;
            $devices.forEach(mediaDevice => {
                $('<option>', {
                    value: mediaDevice.deviceId,
                    text: mediaDevice.label || `Camera ${count++}`
                }).appendTo($selectCameraDropdown);
            });
        };

        let selectMediaStream = async function () {
            let constraints = {audio: false, video: { facingMode: $facingMode } };
            try {
                $currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (e) {
                console.log("Error fetching stream => ", e);
            }
        };

        let retakeImage = async function() {
            await selectMediaStream();
            startCamera();
            showHideCanvasAndVideo(true);
        };

        let startCamera = function () {
            if (typeof $currentStream !== 'undefined') {
                console.log("$currentStream ==> ", $currentStream);
                window.stream = $currentStream; // make stream available to browser console
                $video[0].srcObject = $currentStream;
                showHideCanvasAndVideo(true);
            }
        };

        let captureImage = function () {
            $countdownArea.show();
            console.log("$video[0].videoWidth => ", $video[0].videoWidth);
            console.log("$video[0].videoHeight => ", $video[0].videoHeight);
            $canvas[0].width = $video[0].videoWidth;
            $canvas[0].height = $video[0].videoHeight;
            let captureTimeoutInSeconds = parseInt(plugin.settings.captureTimeoutInSeconds);
            const timeout = captureTimeoutInSeconds * 1000;

            let $counter = $('<div>', {class: "countdown-timer-number", text: captureTimeoutInSeconds});
            $countdownArea.append($counter);

            let countDownTimer = setInterval(function(){
                console.log('captureTimeoutInSeconds => ', captureTimeoutInSeconds);
                captureTimeoutInSeconds--;
                $counter.text(captureTimeoutInSeconds);
            }, 1000);

            setTimeout(function(){
                $canvas[0].getContext('2d').drawImage($video[0], 0, 0, $video[0].videoWidth, $video[0].videoHeight);
                stopMediaTracks();
                clearInterval(countDownTimer);
                $counter.remove();
                $countdownArea.hide();
            }, timeout);

        };

        let flipCamera = async function () {
            console.log("Switch camera executed");
            $facingMode = $facingMode === "user" ? "environment" : "user";
            await selectMediaStream();
            startCamera();
        };

        let stopMediaTracks = function () {
            if (typeof $currentStream !== 'undefined') {
                $currentStream.getTracks().forEach(track => {
                    track.stop();
                });
            }
            showHideCanvasAndVideo(false);
        };

        let showHideCanvasAndVideo = function(showVideo = true) {
            if (showVideo) {
                $captureImageWrapper.show();
                $retakeButton.hide();
                $canvas.hide();
                $okCameraButton.hide();
                $captureButton.show();
                if (typeof $showHideCameraDropdownButton !== 'undefined') {
                    $showHideCameraDropdownButton.show();
                }
            } else {
                $captureImageWrapper.hide();
                $captureButton.hide();
                if (typeof $showHideCameraDropdownButton !== 'undefined') {
                    $showHideCameraDropdownButton.hide();
                }
                $retakeButton.show();
                $canvas.show();
                $okCameraButton.show();

            }
        };

        let changeCameraFromDropdown = function () {
            let $deviceId = $selectCameraDropdown.val();
            console.log("$deviceId ==> ", $deviceId);
            if ($deviceId !== "") {
                const videoConstraints = {};
                videoConstraints.deviceId = {exact: $deviceId};
                const constraints = {
                    video: videoConstraints,
                    audio: false
                };
                navigator.mediaDevices
                    .getUserMedia(constraints)
                    .then(stream => {
                        $currentStream = stream;
                    })
                    .then(startCamera)
                    .catch(error => {
                        console.error(error);
                    });
                $selectCameraDropdown.val("");
                toggleSelectCameraDropdown();
            }
        };

        let acceptImage = function () {
            console.log("Image Accepted");
            const dataURL = $canvas[0].toDataURL();

            const callBackFunction = plugin.settings.callbackFunction;
            console.log("typeof callBackFunction ==>", typeof window[callBackFunction]);
            if (typeof window[callBackFunction] !== 'undefined' && typeof window[callBackFunction] === 'function') {
                window[callBackFunction](dataURL);
            }
            console.log("Image => ", dataURL);
            $wrapper.empty();
        };

        let mobileCheck = function() {
            let check = false;
            (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
            return check;
        };

        let mobileAndTabletCheck = function() {
            let check = false;
            (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
            return check;
        };

        this.init();

        let cameraDropdownToggleImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAABG3AAARtwGaY1MrAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAGxQTFRF////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfHZfwQAAACN0Uk5TAAEJDhITFRksMkNFRkpMbXN1f4CPnqGss8nM2drb3+Hj7v4nmknIAAAA5klEQVQ4y5WT2RKDIAxFg9aqda1acGtd+P9/rA1oYSpF71uSM0NySQBUUb6IglEuR7lGIBBA8FsJG+YBkEwAGQG41m2o1CfOhyjvuVSfxyPnU6jW97QRDTeokQAzAUwC3iATXZn6flp0Mnxd1iYijOfKEaFTzZi4bVPkWE++YyVI3NeQ4HyVakz1yTyJ8DdAfzpHBRzsIwsW1x+yo0L3tpRpCutIqQ6ka34DfB3wzwPGJ6itSeuYf4zqicXqHCyfFYHluwfv6MJYV866tEiMsbr20aDWF6Ktr/rheKwJz5ze0ePdO/83Mq5BiRtu2a0AAAAASUVORK5CYII=";

        let switchCameraImage = "data:image/png;base64,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";

        // Return the instance
        return this;

    };

}(jQuery));
