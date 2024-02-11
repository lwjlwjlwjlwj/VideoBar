// ==UserScript==
// @name         视频状态栏
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  在视频的右上角显示时间和音量等信息，并且可以调节
// @author       lwjlwjlwjlwj
// @match        *://*/*
// @grant        none
// @license      GPL
// @downloadURL https://update.greasyfork.org/scripts/473717/%E8%A7%86%E9%A2%91%E7%8A%B6%E6%80%81%E6%A0%8F.user.js
// @updateURL https://update.greasyfork.org/scripts/473717/%E8%A7%86%E9%A2%91%E7%8A%B6%E6%80%81%E6%A0%8F.meta.js
// ==/UserScript==

(function () {
    let timeout;
    let showButtons = false;
    let showButtons2 = false;
    let onlytime = false;
    let colorflag = 0;
    let videoElement;
    let pomodoroFunction = false;//番茄钟功能开关
    let totalTime = null;
    let beginTime = null;//番茄钟\休息开始时间
    let endTime = null;//番茄钟\休息结束时间
    let isrestTime = false;//番茄钟\休息状态判断
    let workTime = 0.25;
    let restTime = 0.25;
    let audioDivWidth = 0;//audio实际宽度
    let missTime = null;
    let percentage = 0;//音量条百分比
    let onvolumeBar = false;//鼠标是否在音量条上
    let mutevolume = 0;
    let onBar = false;
    //let audioDivHeight = 0;//audio实际宽度

    // 创建一个容器div
    const containerDiv = document.createElement("div");
    containerDiv.style.cssText = `
    font-size: 14px;
    line-height: 1.6;
    position: fixed;
    top: 10px;
    right: 10px;
    display: flex;
    align-items: center;
    z-index: 999999999;
`;

    // 创建显示声音和倍速的圆角矩形div
    const audioDiv = document.createElement("div");
    audioDiv.style.cssText = `
    background-color: rgba(0, 0, 0, 0.5);
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
    display: inline-block;
    margin-right: 10px;
    color: white;
    padding: 5px;
    border-radius: 5px;
    font-family: "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    font-weight: bold;
`;

    // 创建显示通知的圆角矩形div
    const notificationDiv = document.createElement("div");
    notificationDiv.style.cssText = `
    background-color: rgba(0, 0, 0, 0.5);
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
    display: none;
    align-items: center;
    justify-content: space-between;
    margin-right: 10px;
    color: white;
    padding: 5px;
    border-radius: 5px;
    font-family: "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    font-weight: bold;
`;

    // 创建通知的span
    const notificationSpan = document.createElement("span");
    notificationSpan.textContent = "通知内容"; // 添加通知内容
    notificationSpan.style.cursor = "pointer";
    notificationSpan.style.cssText = `
    flex: 1; /* 占据剩余空间 */
    text-align: center;
`;
    notificationDiv.appendChild(notificationSpan);

    // 创建通知的确认按钮
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "确定";
    confirmButton.style.cssText = `
    cursor: pointer;
    background-color: rgba(18, 150, 17, 1);
    border-radius: 3px;
    color: white;
    border: none;
    font-family: "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    font-weight: bold;
    font-size: 8px;
    padding: 0px 3px;
    outline: none;
`;

    // 创建显示倍速的span
    const speedSpan = document.createElement("span");
    speedSpan.style.cursor = "pointer";
    audioDiv.appendChild(speedSpan);

    // 创建增加和减少的按钮
    function createButton(text) {
        const button = document.createElement("button");
        button.textContent = text;
        button.style.cssText = `
    margin-left: 5px;
    cursor: pointer;
    background-color: transparent;
    color: white;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
    border: none;
    font-family: "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    font-weight: bold;
    margin-left: 5px;
    outline: none;
    display: none;
  `;
        return button;
    }

    const increaseSpeedButton = createButton(" + ");
    const decreaseSpeedButton = createButton(" - ");
    const resetSpeedButton = createButton("重置");

    audioDiv.appendChild(increaseSpeedButton);
    audioDiv.appendChild(decreaseSpeedButton);
    audioDiv.appendChild(resetSpeedButton);

    // 创建显示声音大小的span
    const volumeSpan = document.createElement("span");
    volumeSpan.style.cursor = "pointer";
    volumeSpan.style.marginLeft = "10px";
    audioDiv.appendChild(volumeSpan);


    //创建黑色条
    const volumeBar = document.createElement("span");
    volumeBar.style.cssText = `
        width: 70px;
        height: 12px;
        background-color: rgba(0, 0, 0, 0.5);;
        position: relative;
        cursor: pointer;
        margin-left: 5px;
        display: inline-block;
        border-radius: 6px;
        overflow: hidden;
    `;
    // 创建白色音量条
    const volumeIndicator = document.createElement("span");
    volumeIndicator.style.cssText = `
    height: 100%;
    background-color: white;
    position: absolute;
    display：flex;
    top: 0;
    left: 0;
`;

    // 添加音量显示条到音量条中
    volumeBar.appendChild(volumeIndicator);

    // 将音量条添加到页面中
    audioDiv.appendChild(volumeBar);

    // 创建增加和减少声音的按钮
    const increaseVolumeButton = createButton(" + ");
    const decreaseVolumeButton = createButton(" - ");
    const muteVolumeButton = createButton("静音");

    audioDiv.style.whiteSpace = "pre";

    audioDiv.appendChild(increaseVolumeButton);
    audioDiv.appendChild(decreaseVolumeButton);
    audioDiv.appendChild(muteVolumeButton);


    // 创建显示时间的圆角矩形div
    const timeDiv = document.createElement("div");
    timeDiv.style.cssText = `
    background-color: rgba(0, 0, 0, 0.5);
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
    color: white;
    padding: 5px;
    border-radius: 5px;
    cursor: pointer;
    font-family: "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    font-weight: bold;
`;

    const tipDiv = document.createElement("div");
    tipDiv.id = "tipDiv";
    tipDiv.style.cssText = `
    background-color: rgba(0, 0, 0, 0.5);
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
    color: white;
    padding: 5px;
    border-radius: 5px;
    font-family: "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    font-weight: bold;
    display: none;
    margin-right: 10px;
`;

    // 将创建的元素依次添加到容器div中
    containerDiv.appendChild(tipDiv);
    containerDiv.appendChild(audioDiv);
    containerDiv.appendChild(notificationDiv);
    containerDiv.appendChild(timeDiv);


    //监听事件区
    document.addEventListener("mousemove", onMouseMove);
    containerDiv.addEventListener("mousemove", isOnBar);
    containerDiv.addEventListener("mouseleave", noOnbar);
    // 为音量条添加事件监听器
    volumeBar.addEventListener("mousemove", handleMouseMove);
    volumeBar.addEventListener("click", handleClick);
    volumeBar.addEventListener("mouseleave", handleMouseLeave);

    // 当鼠标悬停在speedSpan上时，设置一个2秒的延迟
    speedSpan.addEventListener('mouseenter', function () {
        hoverTimeout = setTimeout(function () {
            // 调整倍速
            videoElement.playbackRate = 2;
            tipDiv.innerHTML = "倍速播放中";
            tipDiv.style.display = "block";
        }, 1000); // 1秒的延时
    });

    // 当鼠标离开speedSpan时，清除之前设置的延迟，并且恢复倍速
    speedSpan.addEventListener('mouseleave', function () {
        clearTimeout(hoverTimeout);
        // 恢复倍速
        videoElement.playbackRate = 1;
        tipDiv.innerHTML = "";
        tipDiv.style.display = "none";
    });

    //点击响应区
    {
        timeDiv.onclick = function () {
            onlytime = !onlytime;
            audioDiv.style.display = onlytime ? "inline-block" : "none";
        };

        //音量交互
        volumeSpan.onclick = function () {
            showButtons = !showButtons;
            increaseVolumeButton.style.display = showButtons ? "inline-block" : "none";
            decreaseVolumeButton.style.display = showButtons ? "inline-block" : "none";
            muteVolumeButton.style.display = showButtons ? "inline-block" : "none";
            increaseSpeedButton.style.display = "none";
            decreaseSpeedButton.style.display = "none";
            resetSpeedButton.style.display = "none";
            showButtons2 = false;
        };

        //倍速交互
        speedSpan.onclick = function () {
            showButtons2 = !showButtons2;
            increaseVolumeButton.style.display = "none";
            decreaseVolumeButton.style.display = "none";
            muteVolumeButton.style.display = "none";
            increaseSpeedButton.style.display = showButtons2 ? "inline-block" : "none";
            decreaseSpeedButton.style.display = showButtons2 ? "inline-block" : "none";
            resetSpeedButton.style.display = showButtons2 ? "inline-block" : "none";
            showButtons = false;
        };

        //子按钮交互
        increaseVolumeButton.onclick = function () {
            if (videoElement) {
                const currentVolume = videoElement.volume;
                const newVolume = Math.min(1, currentVolume + 0.1);
                videoElement.volume = newVolume;
            }
        };

        decreaseVolumeButton.onclick = function () {
            if (videoElement) {
                const currentVolume = videoElement.volume;
                const newVolume = Math.max(0, currentVolume - 0.1);
                videoElement.volume = newVolume;
            }
        };

        muteVolumeButton.onclick = function () {
            if (videoElement) {
                const currentVolume = videoElement.volume;
                if (0 != currentVolume) {
                    videoElement.volume = 0;
                    mutevolume = currentVolume;
                }
                else {
                    if (0 == mutevolume) {
                        const newVolume = Math.min(1, currentVolume + 0.1);
                        videoElement.volume = newVolume;
                    }
                    else {
                        videoElement.volume = mutevolume;
                    }
                    mutevolume = 0;
                }
            }
        };

        increaseSpeedButton.onclick = function () {
            if (videoElement) {
                const currentSpeed = videoElement.playbackRate;
                const newSpeed = Math.min(16, currentSpeed + 0.25);
                videoElement.playbackRate = newSpeed;
            }
        };

        decreaseSpeedButton.onclick = function () {
            if (videoElement) {
                const currentSpeed = videoElement.playbackRate;
                const newSpeed = Math.max(0.25, currentSpeed - 0.25);
                videoElement.playbackRate = newSpeed;
            }
        };

        resetSpeedButton.onclick = function () {
            if (videoElement) {
                videoElement.playbackRate = 1;
            }
        };
    }

    function initialize() {
        updateSpeedAndVolume();
        updateTime();
        requestAnimationFrame(updateTime);
        requestAnimationFrame(pomodoro);
    }

    function notification(text, times) {
        // 设置文本内容
        notificationSpan.textContent = text;

        audioDiv.style.display = "none";
        notificationDiv.style.display = "flex";

        const existingConfirmButton = notificationDiv.querySelector("button");
        if (existingConfirmButton) {
            existingConfirmButton.remove();
        }

        if (times > 0) {
            missTime = new Date().getTime() + times * 1000;
            return false;
        } else if (times === 0) {
            notificationDiv.appendChild(confirmButton);
            return new Promise(resolve => {
                confirmButton.addEventListener("click", () => {
                    missTime = new Date().getTime() + times * 1000;
                    resolve(true);
                });
            });
        }
    }

    function haveNotification() {
        if ("none" != notificationDiv.style.display) {
            return true;
        }
        else {
            return false;
        }
    }

    function pomodoro() {
        if (pomodoroFunction) {
            // 确定当前时间
            const now = new Date();

            // 确定开始时间
            if (totalTime === null) totalTime = now;
            if (beginTime === null) beginTime = now;

            // 确定结束时间
            if (isrestTime) {
                //休息时间
                if (endTime === null) {
                    endTime = new Date(beginTime.getTime() + restTime * 60000);
                }
                else {
                    if (now > endTime) {
                        if (notification("继续学习", 0)) {
                            beginTime = null;
                            endTime = null;
                            isrestTime = false;
                        }
                    }
                }
            } else {
                //番茄钟时间
                if (endTime === null) {
                    endTime = new Date(beginTime.getTime() + workTime * 60000);
                }
                else {
                    if (now > endTime && !haveNotification()) {
                        if (notification("休息时间到了", 0)) {
                            beginTime = null;
                            endTime = null;
                            isrestTime = true;
                            notification("剩余：00:00", 5);
                        }
                    }
                }
            }
        }
    }

    function updateTime() {
        findvideo(); // 输出videoElement的值
        pomodoro();
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const currentTime = `${hours}:${minutes}:${seconds}`;
        const isHalfMinute = (minutes === "29" && seconds >= "30") || (minutes === "59" && seconds >= "30");

        if (isHalfMinute || (minutes === "30" && seconds <= "30") || (minutes === "00" && seconds <= "30")) {
            timeDiv.textContent = currentTime;
            colorflag = parseInt(seconds) % 2;
            if (0 == colorflag && (seconds >= 50 || seconds <= 10)) {
                timeDiv.style.color = "black";
                timeDiv.style.textShadow = "1px 1px 1px white";
            } else {
                timeDiv.style.color = pomodoroFunction ? "rgba(234, 0, 4, 1)" : "white";
                timeDiv.style.textShadow = "1px 1px 1px rgba(0, 0, 0, 0.5)";
            }
        } else {
            timeDiv.textContent = `${hours}:${minutes}`;
            timeDiv.style.color = pomodoroFunction ? "rgba(234, 0, 4, 1)" : "white";
            timeDiv.style.textShadow = "1px 1px 1px rgba(0, 0, 0, 0.5)";
        }
        if (null != missTime && now.getTime() > missTime) {
            notificationDiv.style.display = "none";
            missTime = null;
        }
        updateSpeedAndVolume(); // 实时更新声音和倍速信息
        requestAnimationFrame(updateTime);
        //setTimeout(updateTime, 1000);// 继续更新时间
    }

    function updateSpeedAndVolume() {
        if (!videoElement) {
            audioDiv.style.display = "none";
        } else {
            const speed = videoElement.playbackRate.toString();
            const volume = (videoElement.volume * 100).toFixed(0);
            //判断是否有通知
            if (!haveNotification()) {
                audioDiv.style.display = onlytime ? "inline-block" : "none";
            }
            speedSpan.textContent = `倍速: ${speed}x`;
            //判断是否触发白条
            if (!onvolumeBar) {
                if (0 == volume) {
                    volumeSpan.textContent = `声音: 静音`;
                    muteVolumeButton.textContent = '恢复';
                }
                else {
                    volumeSpan.textContent = `声音: ${volume}%`;
                    muteVolumeButton.textContent = '静音';
                }
                const currentVolume = videoElement.volume;
                volumeIndicator.style.width = `${currentVolume * 100}%`;
            }
            // 更新 audioDivWidth
            audioDivWidth = audioDiv.offsetWidth;
            //if (0 == (new Date().getSeconds() % 2)) console.log(audioDivWidth);
            notificationDiv.style.width = `${audioDivWidth - 10}px`;
            notificationSpan.style.maxWidth = notificationDiv.style.width;
        }
    }

    // 吸附在视频的右上角显示
    function stickToTopRight() {
        if (videoElement) {
            // 获取视频播放器的尺寸和位置信息
            const videoRect = videoElement.getBoundingClientRect();
            // 设置容器div的位置，固定在右上角
            containerDiv.style.top = `${videoRect.top + 10}px`;
            containerDiv.style.right = `${document.documentElement.clientWidth - videoRect.right + 10}px`;
        }
    }

    // 更新容器div的位置，并在视频窗口调整大小或全屏时保持固定位置
    function updatePosition() {
        stickToTopRight();
        setTimeout(updatePosition, 500); // 每0.5秒更新一次位置
    }

    function findvideo() {
        if (window.location.href.includes("www.bilibili.com/video/")) {
            videoElement = document.querySelector("bwp-video");
            if (!videoElement) {
                videoElement = document.querySelector("video");
                //if (0 == (new Date().getSeconds() % 2)) console.log("222:" + videoElement);
            }
            //else if (0 == (new Date().getSeconds() % 2)) console.log("111:" + videoElement);
        } else {
            videoElement = document.querySelector("video");
            //if (0 == (new Date().getSeconds() % 2)) console.log("222:" + videoElement);
        }
        if (null == videoElement) {
            containerDiv.style.display = "none";
        }
        else {
            containerDiv.style.display = "flex";
        }
    }

    function onMouseMove() {
        clearTimeout(timeout);
        if (!onBar) {
            audioDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            timeDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            volumeBar.style.display = "inline-block";

            timeout = setTimeout(() => {
                audioDiv.style.backgroundColor = "rgba(0, 0, 0, 0)";
                if (!haveNotification()) timeDiv.style.backgroundColor = "rgba(0, 0, 0, 0)";
                increaseVolumeButton.style.display = "none";
                decreaseVolumeButton.style.display = "none";
                muteVolumeButton.style.display = "none";
                increaseSpeedButton.style.display = "none";
                decreaseSpeedButton.style.display = "none";
                resetSpeedButton.style.display = "none";
                volumeBar.style.display = "none";
                showButtons = false;
                showButtons2 = false;
            }, 5000);
        }
    }
    // 鼠标在音量条上移动时的事件处理函数
    function handleMouseMove(event) {
        onvolumeBar = true;
        const volumeBarWidth = volumeBar.offsetWidth;
        const mouseX = event.clientX - volumeBar.getBoundingClientRect().left;
        percentage = Math.min(1, Math.max(0, mouseX / volumeBarWidth));
        //白色条的宽度
        if (percentage * 100 < 5) {
            percentage = 0;
        }
        else if (percentage * 100 > 95) {
            percentage = 1;
        }
        const percentageInt = Math.floor(percentage * 100);
        volumeIndicator.style.width = `${percentage * 100}%`;
        volumeSpan.textContent = `声音: ${percentageInt}%`;

    }

    // 鼠标点击音量条时的事件处理函数
    function handleClick(event) {
        videoElement.volume = percentage;
    }

    // 鼠标离开音量条时的事件处理函数
    function handleMouseLeave() {
        onvolumeBar = false;
    }

    function isOnBar(event){
        onBar = true;
        //console.log(onBar);
    }

    function noOnbar(event){
        onBar = false;
        //console.log(onBar);
    }

    // 监听全屏状态变化，将容器div添加到全屏层中
    function handleFullscreenChange() {
        if (document.fullscreenElement) {
            // 进入全屏时将容器div添加到全屏元素中
            document.fullscreenElement.appendChild(containerDiv);
        } else {
            // 退出全屏时将容器div重新添加到页面中
            document.body.appendChild(containerDiv);
        }
        updateSpeedAndVolume(); // 更新倍速和声音信息
    }

    // 调用初始化和更新位置函数，让它们开始实时更新
    initialize();
    updatePosition();

    // 将容器div添加到页面中
    document.body.appendChild(containerDiv);

    // 监听全屏状态变化事件
    document.addEventListener("fullscreenchange", handleFullscreenChange);

})();