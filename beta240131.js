// ==UserScript==
// @name         beta240131
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  在视频的右上角显示时间和音量等信息，并且可以调节
// @author       lwjlwjlwjlwj
// @match        *://*/*
// @grant        none
// @license      GPL
// ==/UserScript==

// 声明全局变量
let containerDiv, audioDiv, timeDiv;
// 应用样式的辅助函数
function applyStyles(element, styles) {
    Object.assign(element.style, styles);
}
// 样式对象
const styles = {
    containerDiv: {
        fontSize: "14px",
        lineHeight: 1.6,
        position: "fixed",
        top: "10px",
        right: "10px",
        display: "flex",
        alignItems: "center",
        zIndex: "999999999",
        userSelect: "none",
        margin: 0,
        fontFamily: "PingFang SC, Helvetica Neue, Arial, sans-serif",
        textShadow: "1px 1px 1px rgba(0, 0, 0, 0.5)",
        color: "white",
        fontWeight: "bold",
    },
    audioDiv: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        marginRight: "10px",
        padding: "5px",
        borderRadius: "5px",
        display: "flex",
        alignItems: "center",
        whiteSpace: "pre",
    },
    button: {
        margin: "0 2px",
        cursor: "pointer",
        backgroundColor: "transparent",
        border: "none",
        outline: "none",
        display: "inline-block",
    },
    speedSpan: {
        cursor: "pointer",
    },
    volumeSpan: {
        cursor: "pointer",
    },
    volumeBar: {
        width: "70px",
        height: "12px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        position: "relative",
        cursor: "pointer",
        marginLeft: "5px",
        display: "inline-block",
        borderRadius: "6px",
        overflow: "hidden",
    },
    volumeIndicator: {
        height: "100%",
        width: "100%",
        backgroundColor: "white",
        position: "absolute",
        display: "flex",
        top: "0",
        left: "0",
    },
    timeDiv: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: "5px",
        borderRadius: "5px",
        cursor: "pointer",
    },
};

// 返回时间函数
function getCurrentTime(formatType = 0) {
    // 获取当前时间
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    var period = '上午'; // 默认为上午
    var currentTime = "";

    // 格式化时间，确保小时、分钟、秒都是两位数
    hours = (hours < 10) ? '0' + hours : hours;
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    seconds = (seconds < 10) ? '0' + seconds : seconds;

    // 根据传入的参数返回不同格式的时间
    if (formatType === 1) {
        // 返回 HH:mm:ss 格式
        currentTime = hours + ':' + minutes + ':' + seconds;
        console.log("getCurrentTime(0) 成功返回当前时间: " + currentTime);
        return currentTime;
    } else if (formatType === 2) {
        // 返回 HH:mm 格式
        currentTime = hours + ':' + minutes;
        console.log("getCurrentTime(1) 成功返回当前时间: " + currentTime);
        return currentTime;
    } else if (formatType === 3) {
        // 判断上午或下午
        period = (hours < 12) ? '上午' : '下午';
        // 返回 上午/下午 HH:mm 格式
        currentTime = period + hours + ':' + minutes;
        console.log("getCurrentTime(2) 成功返回当前时间: " + currentTime);
        return currentTime;
    } else {
        // 默认返回 Date() 格式
        return now;
    }
}
// 查找视频元素函数
function findVideoElement() {
    var videoElement = null;

    function isVideoPage() {
        // 添加支持的网站
        // return (
        //     window.location.href.includes("www.bilibili.com/video") ||
        //     window.location.href.includes("youtube.com/watch") ||
        //     window.location.href.includes("youku.com/v_show") 
        // );
        return true;
    }

    function checkVideoElement() {
        if (isVideoPage()) {
            videoElement = document.querySelector("bwp-video");
            if (!videoElement) {
                videoElement = document.querySelector("video");
            }

            if (videoElement) {
                updatePosition(videoElement);
            } else {
                //如果未找到视频元素，延迟再次检查
                setTimeout(checkVideoElement, 1000); //延迟1秒
            }
        }
    }

    checkVideoElement();
    return videoElement;
}

// 创建按钮
function createButton(text) {
    const button = document.createElement("button");
    button.textContent = text;

    return button;
}

function handleFullscreenChange() {
    if (document.fullscreenElement) {
        // 进入全屏时将容器div添加到全屏元素中
        document.fullscreenElement.appendChild(containerDiv);
    } else {
        // 退出全屏时将容器div重新添加到页面中
        document.body.appendChild(containerDiv);
    }
}

// 初始化函数
function initialization() {
    // 创建并插入 HTML 内容
    containerDiv = document.createElement("div");
    containerDiv.id = "containerDiv";
    applyStyles(containerDiv, styles.containerDiv);

    audioDiv = document.createElement("div");
    audioDiv.id = "audioDiv";
    applyStyles(audioDiv, styles.audioDiv);
    audioDiv.innerHTML = `
        <span id="speedSpan">倍速: 1x</span>
        <span id="volumeSpan" style="margin-left: 10px;">声音: 100%</span>
        <span id="volumeBar">
            <span id="volumeIndicator"></span>
        </span>
    `;

    timeDiv = document.createElement("div");
    timeDiv.id = "timeDiv";
    applyStyles(timeDiv, styles.timeDiv);
    timeDiv.innerHTML = "12:34";

    containerDiv.appendChild(audioDiv);
    containerDiv.appendChild(timeDiv);

    document.body.appendChild(containerDiv);

    // 获取所有按钮并应用通用样式
    const buttons = containerDiv.querySelectorAll('button');
    buttons.forEach(button => applyStyles(button, styles.button));

    // 获取 volumeBar 和 volumeIndicator 元素并应用样式
    const volumeBar = containerDiv.querySelector('#volumeBar');
    applyStyles(volumeBar, styles.volumeBar);

    const volumeIndicator = containerDiv.querySelector('#volumeIndicator');
    applyStyles(volumeIndicator, styles.volumeIndicator);
}

// 添加应用函数
function addApp(type) {

}

// 移除应用函数
function removeApp(type) {

}

// 吸附位置函数
function stickTo(videoElement) {
    // 获取视频播放器的尺寸和位置信息
    const videoRect = videoElement.getBoundingClientRect();
    // 设置容器div的位置，固定在右上角
    containerDiv.style.top = `${videoRect.top + 10}px`;
    containerDiv.style.right = `${document.documentElement.clientWidth - videoRect.right + 10}px`;
}

// 更新容器div的位置，并在视频窗口调整大小或全屏时保持固定位置
function updatePosition(videoElement) {
    stickTo(videoElement);
    setTimeout(function () {
        updatePosition(videoElement);
    }, 500); // 每0.5秒更新一次位置
}

function updateTime() {
    var typeNum = timePrintType;
    // timeDiv.textContent = getCurrentTime(timePrintType);// 根据样式调整时间

    const now = new Date();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    // 在半分钟附近或整点时显示秒数
    typeNum = (
        (minutes === "29" && seconds >= "30") ||
        (minutes === "59" && seconds >= "30") ||
        (minutes === "30" && seconds <= "30") ||
        (minutes === "00" && seconds <= "30")
    ) ? 1 : 2;
    timeDiv.textContent = getCurrentTime(typeNum);

    requestAnimationFrame(updateTime, 1000);// 实时更新时间
}

function updateVolume(videoElement) {
    const volumeSpan = document.getElementById('volumeSpan');
    const volumeIndicator = document.getElementById('volumeIndicator');

    function update() {
        // 获取并更新音量
        const currentVolume = videoElement.volume;
        const percentageVolume = Math.round(currentVolume * 100);
        // 更新音量显示
        volumeSpan.textContent = `声音: ${percentageVolume}%`;
        volumeIndicator.style.width = `${percentageVolume}%`;

        requestAnimationFrame(update); // 继续实时更新
    }

    update(); // 第一次调用以启动实时更新
}

function updateSpeed(videoElement) {
    const speedSpan = document.getElementById('speedSpan');

    function update() {
        const currentSpeed = videoElement.playbackRate;
        speedSpan.textContent = `倍速: ${currentSpeed}x`;

        requestAnimationFrame(update); // 继续实时更新
    }

    update(); // 第一次调用以启动实时更新
}

const timePrintType = 2;// 时间输出格式

// 主函数
(function () {
    // 调用初始化函数
    initialization();

    // 查找视频元素
    var videoElement = findVideoElement();

    // 更新容器div位置
    updatePosition(videoElement);

    // 更新时间、声音、倍速
    requestAnimationFrame(updateTime);
    requestAnimationFrame(() => updateVolume(videoElement));
    requestAnimationFrame(() => updateSpeed(videoElement));

    // 监听全屏状态变化事件
    document.addEventListener("fullscreenchange", handleFullscreenChange);
})();