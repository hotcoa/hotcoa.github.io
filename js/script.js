$(function () {
   $('.map').maphilight({ stroke: true, fill:true, fillColor: 'a986e6', fillOpacity: 0.5, strokeWidth: 5, strokeColor: 'a986e6', strokeOpacity: 0.5});
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

		var link;
		var $span;
        switch (txt) {
            case 'Who am i':
                link = 'html/aboutme.html';
				break;
			case 'Art+tech':
                link = 'html/arttech.html';
				break;
			case 'UX/UI':
                link = 'html/design.html';
                break;
            default:
                break;
		}
		if (link) {
			$span=$(`<a class="mymap_title" href="${link}">`+txt+'</a>');
		} else {
			$span=$(`<span class="mymap_title">`+txt+'</span>');
		}
        
        $span.css({top: Number(top)+20+'px', left: Number(left)+13+'px', position:'absolute'});
        $span.appendTo('#mymap');
    })  
})

function myFunction() {
    alert("test");
}