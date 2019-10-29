const baseUrl = "https://message-list.appspot.com";
const messageUrl = `${baseUrl}/messages`;
const database = []; // database to cache messages
let pageToken; // indicates if there are more messages to retrieve

let topSentinelPreviousY = 0;
let topSentinelPreviousRatio = 0;
let bottomSentinelPreviousY = 0;
let bottomSentinelPreviousRatio = 0;
let listSize = 20;
let currentIndex = 0;

const timeunit = {
  sec: 1000,
  min: 60*1000,
  hr: 60*60*1000,
  day: 24*60*60*1000,
  month: 30*24*60*60*1000, // for simplicity, assume there are 30 days in a month
  year: 365*24*60*60*1000,
}

const getNumFromStyle = numStr => Number(numStr.substring(0, numStr.length - 2));

/* 
* Fetch messages and cache them
*/
function getMessages(nextToken, limit) {
  let params;
  if (nextToken) {
    params = `pageToken=${nextToken}`;
  }

  if (limit) {
    params = params ? `${params}&limit=${limit}` : `limit=${limit}`;
  }

  const mUrl = params? `${messageUrl}?${params}` : messageUrl;

  return $.get(mUrl, function(data) {
    pageToken = data.pageToken;
    data.messages.forEach(item => {
      // calculate updated time of message
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

      // cache the message
      database.push({
        id: item.id,
        content: item.content,
        updateTime: displayTime,
        name: item.author.name,
        photoUrl: baseUrl + item.author.photoUrl
      });
    });
  }); 
}

/*
* Initialize message list
*/
function initializeList(num) {
  const container = document.querySelector(".message-list");
  for (let i = 0; i < Math.min(num, database.length); i++) {
    const tile = document.createElement("LI");
      
    // set attribute for LI elem
    tile.setAttribute("data-msgId", database[i].id);
    tile.setAttribute("data-tileId", i);
    tile.setAttribute("class", "tile");
    tile.setAttribute("id", "tile-" + i);

    // create header elem
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

    // create message elem
    const msg = document.createElement("DIV");
    msg.setAttribute("class", "message");
    msg.innerHTML = database[i].id + ': ' + database[i].content;
    tile.appendChild(header);
    tile.appendChild(msg); 
    container.appendChild(tile);

    // cache tile's height
    database[i].height = tile.offsetHeight;
  }
}

function getSlidingWindowIdx(isScrollDown) {
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

function recycleDOM(firstIndex, isScrollDown) {
  if (isScrollDown && (database.length < (firstIndex + listSize))) {
	  getMessages(pageToken, listSize).then(() => {
      updateTile(firstIndex);
    });
  } else {
    updateTile(firstIndex);
  }
}

function updateTile(firstIndex) {
  for (let i = 0; i < listSize; i++) {
    const idx = i + firstIndex;
    const tile = document.querySelector("#tile-" + i);

    /* Update message tile */
    if (idx < database.length) {
      tile.setAttribute("data-msgId", database[idx].id);
      const header = tile.getElementsByClassName("header")[0];
      header.getElementsByTagName("IMG")[0].setAttribute("src", database[idx].photoUrl);
      const meta = header.getElementsByClassName("meta")[0];
      meta.getElementsByClassName("author-name")[0].innerHTML = database[idx].name;
      meta.getElementsByClassName("update-time")[0].innerHTML = database[idx].updateTime;
      tile.getElementsByClassName("message")[0].innerHTML = database[idx].id + ': ' + database[idx].content;
    } else {
      tile.style.display = 'none';
    }
  }
}

const adjustPaddings = (isScrollDown, firstIdx) => {
	const container = document.querySelector(".message-list");
  const currentPaddingTop = getNumFromStyle(container.style.paddingTop);
  const currentPaddingBottom = getNumFromStyle(container.style.paddingBottom);
  let remPaddingsVal = 0;
  
  if (isScrollDown) {
    firstIdx -= listSize/2;
    for (let i = 0; i < listSize/2; i++) {
      const tile = document.querySelector("#tile-" + i);
      const tileH = $(tile).outerHeight(true); //.offsetHeight;
      database[i+firstIdx].height = tileH;
      remPaddingsVal += tileH;
    }
    
    // add margin
    // remPaddingsVal += 20 * (listSize/2);

  	container.style.paddingTop = currentPaddingTop + remPaddingsVal + "px";
    container.style.paddingBottom = currentPaddingBottom === 0 ? "0px" : currentPaddingBottom - remPaddingsVal + "px";    
  } else {
    for (let i = 0; i < listSize/2; i++) {
      const idx = i + firstIdx;
      remPaddingsVal += database[idx].height;
    }
    // remPaddingsVal += 20 * (listSize/2);

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
    const firstIndex = getSlidingWindowIdx(false);
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
    const firstIndex = getSlidingWindowIdx(true);
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

  var touchStartX, touchStartY, touchEndX, touchEndY;

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
      touchEndX = touchX;
      var xDiff = touchX - touchStartX;
      // var yDiff = touchY - touchStartY;
  
      if (xDiff > 0) {
        if (xDiff > 100) {
          tile.style.opacity = "0.7";
        } else {
          tile.style.opacity = "1";
        }        
        tile.style.transform = "translateX(" + xDiff + "px)";
      } else if (xDiff <= 0) {
        tile.style.opacity = "1";
        tile.style.transform = "translateX(0px)";
      }
    }
  }

  function removeTile(tileToRemove) {
    // remove the elem from database
    let msgId = parseInt(tileToRemove.dataset.msgid);
    let dbIdx = database.findIndex((dbelem) => (dbelem.id === msgId));    
    database.splice(dbIdx, 1);
    //console.log('remove this ' + msgId);
    console.log('remove tile id ' + tileToRemove.dataset.tileid);
    let tileId = parseInt(tileToRemove.dataset.tileid);
    console.log('db idx ', dbIdx);
    console.log(database);
    let fetchMore = false;
    // re-render the remaining part
    for (let i=0; i<=listSize-tileId; i++) {
        let tileIdToUpdate = tileId + i;
        console.log('update tile ' + i + ', ' + tileIdToUpdate);
        const tile = document.querySelector("#tile-" + tileIdToUpdate);
        
        let dbIndexToFetch = dbIdx + i;
        /* Update message tile */
        if (dbIndexToFetch < database.length) {
          tile.setAttribute("data-msgId", database[dbIndexToFetch].id);
          const header = tile.getElementsByClassName("header")[0];
          header.getElementsByTagName("IMG")[0].setAttribute("src", database[dbIndexToFetch].photoUrl);
          const meta = header.getElementsByClassName("meta")[0];
          meta.getElementsByClassName("author-name")[0].innerHTML = database[dbIndexToFetch].name;
          meta.getElementsByClassName("update-time")[0].innerHTML = database[dbIndexToFetch].updateTime;
          tile.getElementsByClassName("message")[0].innerHTML = database[dbIndexToFetch].id + ': ' + database[dbIndexToFetch].content;
        } else {
          break;          
        }        
    }

    // fetch more values
    /* if (pageToken) {
      getMessages(pageToken, listSize).then(() => {
        console.log('fetched more!!');
        // same code
        tile.setAttribute("data-msgId", database[dbIndexToFetch].id);
        const header = tile.getElementsByClassName("header")[0];
        header.getElementsByTagName("IMG")[0].setAttribute("src", database[dbIndexToFetch].photoUrl);
        const meta = header.getElementsByClassName("meta")[0];
        meta.getElementsByClassName("author-name")[0].innerHTML = database[dbIndexToFetch].name;
        meta.getElementsByClassName("update-time")[0].innerHTML = database[dbIndexToFetch].updateTime;
        tile.getElementsByClassName("message")[0].innerHTML = database[dbIndexToFetch].id + ': ' + database[dbIndexToFetch].content;
      });
    }*/

    // additional call if needed
  }

  function handleTouchEnd(evt) {
    // evt.preventDefault();?
    // touch cancel?
    console.log(evt);
    const tile = evt.target.closest("LI");
    if (tile && tile.className === "tile") {
      var xDiff = touchEndX - touchStartX;
      if (xDiff > 550) {
        tile.style.transform = "translateX(150%)";
        tile.style.transition = "transform 1s";

        setTimeout(function () {
          removeTile(tile);
          tile.style.transition = "";
          tile.style.transform = "translateX(0)";        
          tile.style.opacity = "1";  
        }, 500);
        
        
      } else {
        tile.style.opacity = "1";
        tile.style.transform = "translateX(0px)";
      }
    }
    
    touchEndX = null;
    touchStartX = null;
    touchStartY = null;
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
      initializeList(listSize);
      initIntersectionObserver();
    });
}

