$(function () {
   $('.map').maphilight({ stroke: true, fill:true, fillColor: '009DDF', fillOpacity: 0.5, strokeWidth: 5, strokeColor: '009DDF', strokeOpacity: 0.5});
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

        /*var $span=$('<span class="mymap_title">'+txt+'</span>');        
        $span.css({top: Number(top)+40+'px', left: Number(left)+20+'px', position:'absolute'});
        $span.appendTo('#mymap');*/

        var link;
        switch (txt) {
            case 'Who am i':
                link = 'html/aboutme.html';
                break;
            default:
                link = '#';
                break;
        }
        var $span=$(`<a class="mymap_title" href="${link}" target="_blank">`+txt+'</a>');
        $span.css({top: Number(top)+20+'px', left: Number(left)+10+'px', position:'absolute'});
        $span.appendTo('#mymap');
    })  
})

function myFunction() {
    alert("test");
}