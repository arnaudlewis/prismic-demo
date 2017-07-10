$(document).ready(function() {
  $('#image-slider').lightSlider({
    gallery: false,
    auto: true,
    item: 1,
    loop: true,
    slideMargin: 0,
    controls: false,
    enableDrag: false,
    currentPagerPosition: 'left',
    pauseOnHover: true,
    pause: 6000,
  });
});