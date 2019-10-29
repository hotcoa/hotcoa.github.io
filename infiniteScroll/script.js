const baseUrl = "https://message-list.appspot.com";
const messageUrl = `${baseUrl}/messages`;
const database = []; // reserved word?
let pageToken;

const timeunit = {
  sec: 1000,
  min: 60*1000,
  hr: 60*60*1000,
  day: 24*60*60*1000,
  month: 30*24*60*60*1000,
  year: 365*24*60*60*1000,
}

let callCnt = 0;
const getMessages = (nextToken, limit) => {
  let params;
  if (nextToken) {
    params = `pageToken=${nextToken}`;
  }
  if (limit) {
    params = params ? `${params}&limit=${limit}` : `limit=${limit}`;
  }
  const mUrl = params? `${messageUrl}?${params}` : messageUrl;
  callCnt++;
  console.log(callCnt + ': getMessage is called: murl is ' + mUrl);
  return $.get(mUrl, function(data) {
    pageToken = data.pageToken;
    console.log('token is ' + pageToken);
    data.messages.forEach(item => {
      let updateTime = new Date(item.updated);
      let timediff = Date.now() - updateTime;
      let displayTime;
      switch (true) {
        case (timediff > timeunit.year):
          displayTime = Math.floor(timediff/timeunit.year);
          displayTime += (displayTime === 1) ? " year ago" : " years ago";
          break;
        case (timediff > timeunit.month):
          displayTime = Math.floor(timediff/timeunit.month);
          displayTime += (displayTime === 1) ? " month ago" : " months ago";
          break;
        case (timediff > timeunit.day):
          displayTime = Math.floor(timediff/timeunit.day);
          displayTime += (displayTime === 1) ? " day ago" : " days ago";
          break;
        case (timediff > timeunit.hr):
          displayTime = Math.floor(timediff/timeunit.hr);
          displayTime += (displayTime === 1) ? " hour ago" : " hours ago";
          break;
        case (timediff > timeunit.min):
          displayTime = Math.floor(timediff/timeunit.min);
          displayTime += (displayTime === 1) ? " minute ago" : " minutes ago";
          break;
        default:
          displayTime = Math.floor(timediff/timeunit.sec);
          if (displayTime === 0) {
            displayTime = "1 second ago";
          } else {
            displayTime += (displayTime === 1) ? " second ago" : " seconds ago";
          }
          break;
      }

      database.push({
        id: item.id,
        content: item.content,
        updateTime: displayTime,
        name: item.author.name,
        photoUrl: baseUrl + item.author.photoUrl
      });
    });
    console.log(database);
  }); 
}

let topSentinelPreviousY = 0;
let topSentinelPreviousRatio = 0;
let bottomSentinelPreviousY = 0;
let bottomSentinelPreviousRatio = 0;

let listSize = 20;
let currentIndex = 0;

const initList = num => {
  const container = document.querySelector(".message-list");
  
  for (let i = 0; i < num; i++) {
    const tile = document.createElement("LI");
      
    /* Create list element */
    tile.setAttribute("class", "tile");
    tile.setAttribute("id", "tile-" + i);

    const header = document.createElement("DIV");
    header.setAttribute("class", "header");
    const authorImg = document.createElement("IMG");
    authorImg.setAttribute("src", database[i].photoUrl);
    
    const meta = document.createElement("DIV");
    meta.setAttribute("class", "meta");
    const authorName = document.createElement("P");
    authorName.setAttribute("class", "author-name");
    const updateTime = document.createElement("P");
    updateTime.setAttribute("class", "update-time");
    authorName.innerHTML = database[i].name;
    updateTime.innerHTML = database[i].updateTime;
    meta.appendChild(authorName);
    meta.appendChild(updateTime);

    header.appendChild(authorImg);
    header.appendChild(meta);

    const msg = document.createElement("DIV");
    msg.setAttribute("class", "message");
    msg.innerHTML = database[i].id + ': ' + database[i].content;
    tile.appendChild(header);
    tile.appendChild(msg); 
    container.appendChild(tile);
    database[i].height = tile.offsetHeight;
  }
  
}

const getSlidingWindow = isScrollDown => {
	const increment = listSize / 2;
	let firstIndex;
  
  if (isScrollDown) {
  	firstIndex = currentIndex + increment;
  } else {
    firstIndex = currentIndex - increment;
  }
  
  if (firstIndex < 0) {
  	firstIndex = 0;
  }
  
  return firstIndex;
}

let cnt = 0;

const recycleDOM = (firstIndex, isScrollDown) => {
  console.log('first index is ' + firstIndex);
  const direction = isScrollDown ? "down" : "up";
  if (isScrollDown && (database.length < (firstIndex + listSize))) {
    // todo: call this only when this runs out of cache
	  getMessages(pageToken, 20).then(() => {
      for (let i = 0; i < listSize; i++) {
        const idx = i + firstIndex;
        const tile = document.querySelector("#tile-" + i);
        console.log(`recycle ${direction} => idx: ${idx}, db id: ${database[idx].id}`);

        /* Update message tile */
        const header = tile.getElementsByClassName("header")[0];
        header.getElementsByTagName("IMG")[0].setAttribute("src", database[idx].photoUrl);
        const meta = header.getElementsByClassName("meta")[0];
        meta.getElementsByClassName("author-name")[0].innerHTML = database[idx].name;
        meta.getElementsByClassName("update-time")[0].innerHTML = database[idx].updateTime;
        tile.getElementsByClassName("message")[0].innerHTML = database[idx].id + ': ' + database[idx].content;

        /*
        <div class="tile">
            <div class="header">
                -- <img src="https://message-list.appspot.com/photos/william-shakespeare.jpg"></img>
                <div class="meta">
                    <p class="author-name">Hiyo</p>
                    <p class="update-time">30 minutes ago</p>
                </div>
            </div>
            <div class="message">
                Her pretty looks have been mine enemies, And therefore have I invoked thee for her seal, and meant thereby Thou shouldst print more, not let that pine to aggravate thy store Buy terms divine in selling hours of dross Within be fed, without be rich no more So shalt thou feed on Death, that feeds on men, And Death once dead, there's no more to shame nor me nor you.  
            </div>
        </div>
        */
      }
    });
  } else {
  	for (let i = 0; i < listSize; i++) {
        const idx = i + firstIndex;
        const tile = document.querySelector("#tile-" + i);
        console.log(`recycle ${direction} => idx: ${idx}, db id: ${database[idx].id}`);

        /* Update message tile */
        const header = tile.getElementsByClassName("header")[0];
        header.getElementsByTagName("IMG")[0].setAttribute("src", database[idx].photoUrl);
        const meta = header.getElementsByClassName("meta")[0];
        meta.getElementsByClassName("author-name")[0].innerHTML = database[idx].name;
        meta.getElementsByClassName("update-time")[0].innerHTML = database[idx].updateTime;
        tile.getElementsByClassName("message")[0].innerHTML = database[idx].id + ': ' + database[idx].content;
    }
  }
}

const getNumFromStyle = numStr => Number(numStr.substring(0, numStr.length - 2));

/*

const adjustPaddings = isScrollDown => {
	const container = document.querySelector(".cat-list");
  const currentPaddingTop = getNumFromStyle(container.style.paddingTop);
  const currentPaddingBottom = getNumFromStyle(container.style.paddingBottom);
  const remPaddingsVal = 170 * (listSize / 2);
	if (isScrollDown) {
  	container.style.paddingTop = currentPaddingTop + remPaddingsVal + "px";
    container.style.paddingBottom = currentPaddingBottom === 0 ? "0px" : currentPaddingBottom - remPaddingsVal + "px";
  } else {
  	container.style.paddingBottom = currentPaddingBottom + remPaddingsVal + "px";
    container.style.paddingTop = currentPaddingTop === 0 ? "0px" : currentPaddingTop - remPaddingsVal + "px";
    
  }
}
*/
const adjustPaddings = (isScrollDown, firstIdx) => {
	const container = document.querySelector(".message-list");
  const currentPaddingTop = getNumFromStyle(container.style.paddingTop);
  const currentPaddingBottom = getNumFromStyle(container.style.paddingBottom);
  let remPaddingsVal = 0;
  
  console.log('push down by ' + remPaddingsVal);
  
  if (isScrollDown) {
    for (let i = 0; i < listSize/2; i++) {
      const tile = document.querySelector("#tile-" + i);
      database[i+firstIdx].height = tile.offsetHeight;
      remPaddingsVal += tile.offsetHeight;
    }  
    remPaddingsVal += 20 * (listSize/2);
    //remPaddingsVal = 520 * (listSize/2);

  	container.style.paddingTop = currentPaddingTop + remPaddingsVal + "px";
    container.style.paddingBottom = currentPaddingBottom === 0 ? "0px" : currentPaddingBottom - remPaddingsVal + "px";
    
  } else {
    for (let i = 0; i < listSize/2; i++) {
      const idx = i + firstIdx;
      // const tile = document.querySelector("#tile-" + idx);
      // database[i+firstIdx].height = tile.offsetHeight;
      remPaddingsVal += database[idx].height;
    }
    remPaddingsVal += 20 * (listSize/2);
    // remPaddingsVal = 520 * (listSize/2);

    container.style.paddingBottom = currentPaddingBottom + remPaddingsVal + "px";
    container.style.paddingTop = currentPaddingTop === 0 ? "0px" : currentPaddingTop - remPaddingsVal + "px";
  }
}

const topSentCallback = entry => {
  console.log('topSentCallBack is called');
	if (currentIndex === 0) {
		const container = document.querySelector(".message-list");
  	container.style.paddingTop = "0px";
  	container.style.paddingBottom = "0px";
  }

  const currentY = entry.boundingClientRect.top;
  const currentRatio = entry.intersectionRatio;
  const isIntersecting = entry.isIntersecting;

  // conditional check for Scrolling up
  if (
    currentY > topSentinelPreviousY && // it means the top sentinel's y is growing
    isIntersecting &&
    currentRatio >= topSentinelPreviousRatio &&
    currentIndex !== 0
  ) {
    const firstIndex = getSlidingWindow(false);
    adjustPaddings(false, firstIndex);
    recycleDOM(firstIndex, false);
    currentIndex = firstIndex;
  }

  topSentinelPreviousY = currentY;
  topSentinelPreviousRatio = currentRatio;
}

// add loading logo?
const botSentCallback = entry => {  
	if (!pageToken) { //DBSize - listSize) {
    console.log('botSentCallback just returned');
  	return;
  }
  /*if (currentIndex === DBSize - listSize) {
  	return;
  }*/

  const currentY = entry.boundingClientRect.top;
  const currentRatio = entry.intersectionRatio;
  const isIntersecting = entry.isIntersecting;
  console.log('botSentCallBack is called');
  // conditional check for Scrolling down
  if (
    currentY < bottomSentinelPreviousY &&
    currentRatio > bottomSentinelPreviousRatio &&
    isIntersecting
  ) {
    const firstIndex = getSlidingWindow(true);
    adjustPaddings(true, firstIndex);
    recycleDOM(firstIndex, true);
    
    currentIndex = firstIndex;
  }

  bottomSentinelPreviousY = currentY;
  bottomSentinelPreviousRatio = currentRatio;
}

const initIntersectionObserver = () => {
  const options = {
  	//root: document.querySelector(".message-list")
  }

  const callback = entries => {
    entries.forEach(entry => {
      if (entry.target.id === 'tile-0') {
        topSentCallback(entry);
      } else if (entry.target.id === `tile-${listSize - 1}`) {
        botSentCallback(entry);
      }
    });
  }

  var observer = new IntersectionObserver(callback, options);
  observer.observe(document.querySelector("#tile-0"));
  observer.observe(document.querySelector(`#tile-${listSize - 1}`));
}  

  var touchStartX, touchStartY;

  function handleTouchStart(evt) {
    const firstTouch = (evt.touches || evt.originalEvent.touches[0])[0];
    console.log(firstTouch);
    console.log(firstTouch.clientX);
    touchStartX = firstTouch.clientX;                                      
    touchStartY = firstTouch.clientY;
    console.log('touch start: ' + touchStartX);                                    
  };                                                

  function handleTouchMove(evt) {
    /*if ( ! xDown || ! yDown ) {
        return;
    }*/

    const tile = evt.target.closest("LI");
    if (tile && tile.className === "tile") {
      var touchX = evt.touches[0].clientX;                                    
      var touchY = evt.touches[0].clientY;
      var xDiff = touchX - touchStartX;
      // var yDiff = touchY - touchStartY;
  
      if (xDiff > 0) {
        tile.style.opacity = "0.5";
        tile.style.transform = "translateX(" + xDiff + "px)";
      } else if (xDiff <= 0) {
        tile.style.opacity = "1";
        tile.style.transform = "translateX(0px)";
      }
    }
  }

  function handleTouchEnd(evt) {
    // evt.preventDefault();?
    // touch cancel?
    xDown = null;
    yDown = null;
  }

window.onload = function() {
    var touchsurface = document.getElementById('container');
    touchsurface.addEventListener('touchstart', handleTouchStart, false);
    touchsurface.addEventListener('touchmove', handleTouchMove, false);
    touchsurface.addEventListener('touchend', handleTouchEnd, false);

    var currDate = new Date();
    var hourMinFormat = currDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    console.log(hourMinFormat);
    document.getElementById("header-time").innerHTML = hourMinFormat;
    
    getMessages(pageToken, 20).then(() => {
      initList(listSize);
      initIntersectionObserver();
    });
}

