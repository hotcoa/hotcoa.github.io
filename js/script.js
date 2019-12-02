$(function () {
   //$('.map').maphilight({ stroke: true, fill:true, fillColor: 'a986e6', fillOpacity: 0.5, strokeWidth: 5, strokeColor: 'a986e6', strokeOpacity: 0.5});
});

/*
$.fn.maphilight.defaults = {
	fill: true,
	fillColor: '000000',
	fillOpacity: 0.2,
	stroke: true,
	strokeColor: 'ff0000',
	strokeOpacity: 1,
	strokeWidth: 1,
	fade: true,
	alwaysOn: false,
	neverOn: false,
	groupBy: false,
	wrapClass: true,
	shadow: false,
	shadowX: 0,
	shadowY: 0,
	shadowRadius: 6,
	shadowColor: '000000',
	shadowOpacity: 0.8,
	shadowPosition: 'outside',
	shadowFrom: false
}
*/

$(function() {
    $('area').each(function(){
        var txt=$(this).attr('title');
        var coor=$(this).attr('coords');
        var coorA=coor.split(',');
        var left=coorA[0];
        var top=coorA[1];

		var spaceIdx = 0;
		var link;
		var $span;
        switch (txt) {
            case 'Who am I?':
                link = 'html/aboutme.html';
				break;
			case 'Art + Tech':
				link = 'html/arttech.html';
				spaceIdx = 1;
				break;
			case 'Azure UX':
				link = 'html/design.html';
				spaceIdx = 2;
				break;
			case 'Community':
				spaceIdx = 3;
				break;
			case 'Party with mom':
				spaceIdx = 4;
				break;
			case 'Adventure':
				spaceIdx = 5;
				break;
			case 'Voice rest':
				spaceIdx = 6;
				break;
			case 'Love':
				spaceIdx = 7;
				break;
            default:
                break;
		}
		if (link) {
			$span=$(`<a class="mymap_title" href="${link}">`+txt+'</a>');
		} else {
			$span=$(`<span class="mymap_title_nolink">`+txt+'</span>');
		}

		var spacing = [
			{ top: 30, left: 35 }, // who am i
			{ top: 20, left: 8 }, // art tech
			{ top: 40, left: 8 }, // azure ux

			{ top: 20, left: 20 },
			{ top: 10, left: 10 },
			{ top: 20, left: -7 }, // adventure
			{ top: 15, left: 25 }, // voice rest
			{ top: 36, left: 40 }, // love
		]
        $span.css({top: Number(top) + spacing[spaceIdx].top + 'px', left: Number(left) + spacing[spaceIdx].left + 'px', position:'absolute'});
        $span.appendTo('#mymap');
    })  
})

function myFunction() {
    alert("test");
}