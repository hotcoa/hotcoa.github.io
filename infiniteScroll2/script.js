const baseUrl = "https://message-list.appspot.com";
const messageUrl = `${baseUrl}/messages`;
const database = []; // reserved word?
let pageToken;

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
      database.push({
        id: item.id,
        content: item.content,
        updated: item.updated,
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
  console.log('initList: ' + num);
  for (let i = 0; i < num; i++) {
    console.log(i);
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
  
    const viewportHeight = window.innerHeight;
    const lastTile = document.querySelector("#tile-" + (listSize-1));
    const lastElemPosY = lastTile.getBoundingClientRect().top;
    remPaddingsVal += viewportHeight - lastElemPosY

  	container.style.paddingTop = currentPaddingTop + remPaddingsVal + "px";
//    container.style.paddingBottom = currentPaddingBottom === 0 ? "0px" : currentPaddingBottom - remPaddingsVal + "px";
    
  } else {
    for (let i = 0; i < listSize/2; i++) {
      const idx = i + firstIdx;
      // const tile = document.querySelector("#tile-" + idx);
      // database[i+firstIdx].height = tile.offsetHeight;
      remPaddingsVal += database[idx].height;
    }
    
    container.style.paddingTop = currentPaddingTop === 0 ? "0px" : currentPaddingTop - remPaddingsVal + "px";
    
    /*container.style.paddingBottom = currentPaddingBottom + remPaddingsVal + "px";
    container.style.paddingTop = currentPaddingTop === 0 ? "0px" : currentPaddingTop - remPaddingsVal + "px";*/
  }
}

const topSentCallback = entry => {
  console.log('topSentCallBack is called');
	if (currentIndex === 20) {
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

const botSentCallback = entry => {
  console.log('botSentCallBack is called');
	if (!pageToken) { //DBSize - listSize) {
    console.log('botSentCallback just returned');
  	return;
  }
  const currentY = entry.boundingClientRect.top;
  const currentRatio = entry.intersectionRatio;
  const isIntersecting = entry.isIntersecting;
  console.log('botSentCallback got called');
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
  	/* root: document.querySelector(".message-list") */
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


const testTouch = () => { 
    var touchsurface = document.getElementById('touchsurface'),
        startX,
        startY,
        dist,
        threshold = 150, //required min distance traveled to be considered swipe
        allowedTime = 200, // maximum time allowed to travel that distance
        elapsedTime,
        startTime
 
    function handleswipe(isrightswipe){
        if (isrightswipe)
            touchsurface.innerHTML = 'Congrats, you\'ve made a <span style="color:red">right swipe!</span>'
        else{
            touchsurface.innerHTML = 'Condition for right swipe not met yet'
        }
    }
 
    touchsurface.addEventListener('touchstart', function(e){
        touchsurface.innerHTML = '';
        var touchobj = e.changedTouches[0];
        dist = 0;
        startX = touchobj.pageX;
        startY = touchobj.pageY;
        startTime = new Date().getTime(); // record time when finger first makes contact with surface
        e.preventDefault();
    }, false)
 
    touchsurface.addEventListener('touchmove', function(e){
        e.preventDefault(); // prevent scrolling when inside DIV
    }, false)
 
    touchsurface.addEventListener('touchend', function(e){
        var touchobj = e.changedTouches[0];
        dist = touchobj.pageX - startX; // get total dist traveled by finger while in contact with surface
        elapsedTime = new Date().getTime() - startTime; // get time elapsed
        // check that elapsed time is within specified, horizontal dist traveled >= threshold, and vertical dist traveled <= 100
        var swiperightBol = (elapsedTime <= allowedTime && dist >= threshold && Math.abs(touchobj.pageY - startY) <= 100);
        handleswipe(swiperightBol);
        e.preventDefault();
    }, false)
}

window.onload = function() {
    testTouch();
    var currDate = new Date();
    var hourMinFormat = currDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    console.log(hourMinFormat);
    document.getElementById("header-time").innerHTML = hourMinFormat;
    
    getMessages(pageToken, 20).then(() => {
      initList(listSize);
      initIntersectionObserver();
    });
}

