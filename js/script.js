$(function() {
    $('.map').maphilight();
  });
  
  $(function() {
      $('area').each(function(){
          var txt=$(this).attr('title');
          var coor=$(this).attr('coords');
          var coorA=coor.split(',');
          var left=coorA[0];
          var top=coorA[1];
  
          var $span=$('<span class="mymap_title">'+txt+'</span>');        
          $span.css({top: Number(top)+40+'px', left: Number(left)+20+'px', position:'absolute'});
          $span.appendTo('#mymap');
      })
  
  })