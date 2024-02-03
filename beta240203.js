// ==UserScript==
// @name         beta240203
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  在视频的右上角显示时间和音量等信息，并且可以调节
// @author       lwjlwjlwjlwj
// @match        *://*/*
// @grant        none
// @license      GPL
// ==/UserScript==

// 声明全局变量
var videoElement;
let containerDiv, statusBarDiv, audioDiv, timeDiv, appDiv, tipDiv;
let timeout;// 鼠标全局监听事件
const timePrintType = 2;// 时间输出格式
let onvolumeBar = false, percentageBar = 0;// 白条使用的全局属性
var hoverTimeout;// 悬浮倍速的全局属性
var curActiveApp = 'none';// 当前激活应用

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
        flexDirection: "column", // 垂直排列子元素
        alignItems: "flex-end",
        zIndex: "999999999",
        userSelect: "none",
        margin: 0,
        fontFamily: "PingFang SC, Helvetica Neue, Arial, sans-serif",
        color: "white",
        fontWeight: "bold",
    },
    statusBarDiv: {
        display: "flex",
        // alignItems: "center",
        alignSelf: "flex-end",
        textShadow: "1px 1px 1px rgba(0, 0, 0, 0.5)",
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
    tipDiv: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        marginRight: "10px",
        padding: "5px",
        borderRadius: "5px",
        display: "none",
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
    appDiv: {
        alignSelf: "flex-end",
        width: "200px",
        height: "200px",
        backgroundColor: "green",
        marginLeft: "auto",
        marginTop: "10px",
        marginRight: "0px",
        display: "none",
    },
    speedApp: {
        display: "block",
        alignSelf: "flex-end",
        width: "300px",
        height: "100px",
        marginLeft: "auto",
        marginTop: "10px",
        marginRight: "0px",
        color: "red",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    volumeApp: {
        display: "block",
        alignSelf: "flex-end",
        width: "100px",
        height: "100px",
        marginLeft: "auto",
        marginTop: "10px",
        marginRight: "0px",
        color: "blue",
        backgroundColor: "lightblue",
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

function onMouseMove() {
    clearTimeout(timeout);

    const volumeBar = containerDiv.querySelector('#volumeBar');
    audioDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    timeDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    volumeBar.style.display = "inline-block";

    timeout = setTimeout(() => {
        audioDiv.style.backgroundColor = "rgba(0, 0, 0, 0)";
        timeDiv.style.backgroundColor = "rgba(0, 0, 0, 0)";
        volumeBar.style.display = "none";
    }, 5000);
}

// 创建按钮
function createButton(text) {
    const button = document.createElement("button");
    button.textContent = text;

    return button;
}

// 全屏变化函数
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
    applyStyles(containerDiv, styles.containerDiv);

    statusBarDiv = document.createElement("div");
    statusBarDiv.id = "statusBarDiv";
    applyStyles(statusBarDiv, styles.statusBarDiv);

    tipDiv = document.createElement("div");
    tipDiv.id = "tipDiv";
    applyStyles(tipDiv, styles.tipDiv);

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

    appDiv = document.createElement("div");
    appDiv.id = "appDiv";
    applyStyles(appDiv, styles.appDiv);

    // 添加子元素到状态栏
    statusBarDiv.appendChild(tipDiv);
    statusBarDiv.appendChild(audioDiv);
    statusBarDiv.appendChild(timeDiv);

    // 添加状态栏和appDiv到容器
    containerDiv.appendChild(statusBarDiv);
    containerDiv.appendChild(appDiv);

    document.body.appendChild(containerDiv);

    // 获取 speedSpan 和 volumeSpan 元素并应用样式
    const speedSpan = audioDiv.querySelector('#speedSpan');
    applyStyles(speedSpan, styles.speedSpan);

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

    const volumeSpan = audioDiv.querySelector('#volumeSpan');
    applyStyles(volumeSpan, styles.volumeSpan);

    // 获取 volumeBar 和 volumeIndicator 元素并应用样式
    const volumeBar = containerDiv.querySelector('#volumeBar');
    applyStyles(volumeBar, styles.volumeBar);

    const volumeIndicator = containerDiv.querySelector('#volumeIndicator');
    applyStyles(volumeIndicator, styles.volumeIndicator);

    // 为音量条添加事件监听器
    volumeBar.addEventListener("mousemove", volumeBarMouseMove);
    volumeBar.addEventListener("click", volumeBarClick);
    volumeBar.addEventListener("mouseleave", volumeBarMouseLeave);

    // 为speedSpan绑定点击事件
    addNewApp('speedSpan', 'speed');

    // 为volumeSpan绑定点击事件
    addNewApp('volumeSpan', 'volume');
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

    updateVolume();// 更新音量
    updateSpeed();// 更新倍速
    requestAnimationFrame(updateTime);// 实时更新时间
}

function updateVolume() {
    const volumeSpan = document.getElementById('volumeSpan');
    const volumeIndicator = document.getElementById('volumeIndicator');

    function update() {
        // 获取并更新音量
        const currentVolume = videoElement.volume;
        const percentageVolume = Math.round(currentVolume * 100);

        volumeIndicator.style.width = `${percentageVolume}%`;// 更新白条宽度
        // 更新音量显示
        if (0 != currentVolume) {
            volumeSpan.textContent = `声音: ${percentageVolume}%`;
        }
        else {
            volumeSpan.textContent = `声音: 静音`;
        }

    }

    if (!onvolumeBar) update(); // 更新声音
}

function volumeBarMouseMove(event) {
    const volumeSpan = document.getElementById('volumeSpan');
    const volumeBar = document.getElementById('volumeBar');
    const volumeIndicator = document.getElementById('volumeIndicator');

    const volumeBarWidth = volumeBar.offsetWidth;
    const mouseX = event.clientX - volumeBar.getBoundingClientRect().left;
    const currentVolume = videoElement.volume;
    const percentageVolume = Math.round(currentVolume * 100);

    onvolumeBar = true;
    percentageBar = Math.min(1, Math.max(0, mouseX / volumeBarWidth));
    //白色条的宽度
    if (percentageBar * 100 < 5) {
        percentageBar = 0;
    }
    else if (percentageBar * 100 > 96) {
        percentageBar = 1;
    }
    const percentageInt = Math.floor(percentageBar * 100);
    volumeIndicator.style.width = `${percentageBar * 100}%`;
    if (0 != percentageInt) {
        volumeSpan.textContent = `声音: ${percentageInt}%`;
    }
    else {
        volumeSpan.textContent = `声音: 静音`;
    }
}

// 鼠标点击音量条时的事件处理函数
function volumeBarClick(event) {
    videoElement.volume = percentageBar;
}

// 鼠标离开音量条时的事件处理函数
function volumeBarMouseLeave() {
    onvolumeBar = false;
}

function updateSpeed() {
    const speedSpan = document.getElementById('speedSpan');

    function update() {
        const currentSpeed = videoElement.playbackRate;
        speedSpan.textContent = `倍速: ${currentSpeed}x`;
    }

    update(); // 更新倍速
}

function replaceElementWithClone(element) {
    var newElement = element.cloneNode(false);
    element.parentNode.replaceChild(newElement, element);
    return newElement;
}

// 添加新应用
function addNewApp(appIcon, appName) {
    document.getElementById(appIcon).addEventListener('click', function () {
        displayAppContent(appName);
    });
}

function displayAppContent(type) {
    var appDiv = document.getElementById('appDiv');

    // 获取内容的HTML模板
    fetchHtmlContent(type, function (htmlContent) {
        // 判断appDiv当前是否显示且内容相同
        if (curActiveApp == type || 'close' == type) {
            // 如果是，则隐藏appDiv
            appDiv.style.display = 'none';
            appDiv.style.cssText = '';
            appDiv.innerHTML = '';
            curActiveApp = 'none';
        } else {
            // 替换appDiv以移除所有当前绑定的事件
            curActiveApp = type;
            appDiv = replaceElementWithClone(appDiv);

            // 设置appDiv可见
            appDiv.style.display = 'block';
            appDiv.style.cssText = '';
            appDiv.innerHTML = htmlContent;
            applyStyles(appDiv, styles[type + 'App']);

            // 选择appDiv内所有的button元素并应用styles.button样式
            var buttons = appDiv.getElementsByTagName('button');
            for (var i = 0; i < buttons.length; i++) {
                applyStyles(buttons[i], styles.button);
            }

            // 绑定事件区
            switch (type) {
                case 'speed':
                    bindSpeedAppControlEvents();
                    break;
                default:
                    break; // 无匹配类型
            }
        }
    });
}

// 异步抓取HTML内容或者渲染HTML模板
function fetchHtmlContent(type, callback) {
    setTimeout(function () {
        var htmlContent = '';
        switch (type) {
            case 'speed':
                htmlContent = `
                    <div class="app-content speed-app">
                        <button id="decreaseSpeed"> - </button>
                        <button id="resetSpeed">重置</button>
                        <button id="increaseSpeed"> + </button>
                    </div>`;
                break;
            case 'volume':
                htmlContent = '<div class="app-content volume-app">这是声音控制功能的界面内容。</div>';
                break;
            // 根据type添加更多case分支
        }
        callback(htmlContent);
    }, 100); // 模拟异步操作延迟
}

function bindSpeedAppControlEvents() {
    const increaseSpeedButton = document.getElementById('increaseSpeed');
    if (increaseSpeedButton) {
        increaseSpeedButton.addEventListener('click', function () {
            // 增加倍速的代码逻辑
            videoElement.playbackRate = Math.min(videoElement.playbackRate + 0.25, 2);
        });
    }

    const decreaseSpeedButton = document.getElementById('decreaseSpeed');
    if (decreaseSpeedButton) {
        decreaseSpeedButton.addEventListener('click', function () {
            // 减少倍速的代码逻辑
            videoElement.playbackRate = Math.max(videoElement.playbackRate - 0.25, 0.25);
        });
    }

    const resetSpeedButton = document.getElementById('resetSpeed');
    if (resetSpeedButton) {
        resetSpeedButton.addEventListener('click', function () {
            // 重置倍速的代码逻辑
            videoElement.playbackRate = 1;
        });
    }
}

// 主函数
(function () {
    // 调用初始化函数
    initialization();

    // 查找视频元素
    videoElement = findVideoElement();

    // 更新容器div位置
    updatePosition(videoElement);

    // 更新时间、声音、倍速
    requestAnimationFrame(updateTime);
    requestAnimationFrame(() => updateVolume(videoElement));
    requestAnimationFrame(() => updateSpeed(videoElement));

    // 监听鼠标静止状态
    document.addEventListener("mousemove", onMouseMove);

    // 监听全屏状态变化事件
    document.addEventListener("fullscreenchange", handleFullscreenChange);
})();