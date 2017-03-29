$(function() {

  var $weather = $('.weather');
  var $goalInput = $('.mainForm input');
  var $clock = $('.clock');
  var $usClock = $('.usclock');
  var $datep = $('.date');
  var $quote = $('blockquote');
  //var visible = $clock.hasClass('hide');

  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var latitude = (position.coords.latitude);
      var longitude = (position.coords.longitude);
      // var url = 'https://api.apixu.com/v1/current.json?key=981a4177d5834ae89f9180839172203&q=' + latitude + ',' + longitude;

      //API keys from OpenWeatherMap.com
      var apikey = "54e8a43f5589a7c590f20fdd08aacde1";
      //default key : a608afe2d88483c2a0197c42108a03c6
      var url = "https://cors-anywhere.herokuapp.com/http://api.openweathermap.org/data/2.5/weather?lat=" + latitude + "&lon=" + longitude + "&type=accurate&units=imperial&APPID=" + apikey;

      $.getJSON(url, function(json) {

        var fahr = Math.round(json.main.temp);
        var cels = Math.round((json.main.temp - 32) / 1.8);
        var condition = json.weather[0].main;
        // for more precise description (such as 'scattered clouds' instead of 'Clouds'), use:
        // json.weather[0].description;
        var location = json.name;

        var $icon = "<img src='http://openweathermap.org/img/w/" + json.weather[0].icon + ".png'>";
        //var $icon = "<img src='http://openweathermap.org/img/w/" + json.weather[0].icon + ".png'>";
        // $weather.append($icon);
        //     $('.temp').html($icon + ' ' + cels + '\u00B0 C');
        $weather.append($('<p>').html($icon + cels + '\u00B0 C'));
        //      $weather.append($('<p>').text(condition));
        $weather.append($('<p>').text(location));
      });
    });
  }

    // Quotes from forismatic
    
var call = "https://cors-anywhere.herokuapp.com/http://api.forismatic.com/api/1.0/?method=getQuote&key=457653&format=json&lang=en";
$.getJSON(call, function(quote) {
    var theQuote = quote.quoteText;
    var author = quote.quoteAuthor;
    $quote.append($('<div>').text('\u275D ' + theQuote + '\u275E'));
    $quote.append($('<cite>').text('\u007E' + author));
});

  // $('.mainForm input').eq(0).focus();   // Chrome forbids the extensions that substitute the new tab page from grabbing focus from the omnibar

  // Hide one element, display another one and do it smoothly
  function transitionSmoothly(toHide, toDisplay) {
    toHide.css('opacity', 0);       // used in conjunction with the css 'transition' property to make it gradually disappear
    setTimeout(function() {
      toHide.css('display', 'none');   // when transition is over (rough approximation of 1000ms), remove the element from the document flow
      toDisplay.css('display', 'block');   // and add the other one instead - default CSS value for opacity is set to 0, so it won't appear yet
      setTimeout(function() {
        toDisplay.css('opacity', '1');   // A slight delay is needed before setting the opacity to 1, otherwise 'transition' effect will be ignored
      }, 10);                              // because the 'display' property for this element has just been modified
    }, 1000);
  }


  // attach 'submit' event handler to daily focus prompt
  $('.mainForm').on('submit', function(event) {
    event.preventDefault();     // prevent the page from reloading, which is the default action for 'submit' event
    var goal = $goalInput.val();
    if(goal) {                  // ensure that the input is not empty
      chrome.storage.sync.set({'mainGoal': goal});     // store the input text
      $('#submittedGoal + label > span').text(goal);
      transitionSmoothly($('.goalPrompt'), $('.submittedGoalContainer'));
    }

  });

  // attach event handler to the 'x' button to remove the daily focus
  $('#removeDailyGoal').on('click', function() {
    $goalInput.val('');
    chrome.storage.sync.set({'mainGoal': ''});    // remove the daily focus text from the storage
    transitionSmoothly($('.submittedGoalContainer'), $('.goalPrompt'));
    setTimeout(function() {                         // set the checkbox contents to nothing and reset its 'checked' property after enough time has passed, allowing the
      $('#submittedGoal + label > span').text('');// containing div to disappear
      $('#submittedGoal').prop('checked', false);
    }, 1000);
  });

  // Test if the submit text has been saved
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
      var storageChange = changes[key];
      console.log('Storage key "%s" in namespace "%s" changed. ' +
      'Old value was "%s", new value is "%s".',
      key,
      namespace,
      storageChange.oldValue,
      storageChange.newValue);
    }
  });

  setInterval(theTime, 1000);

  function padZero(n) {
    return n < 10 ? '0' + n : n;
  }

  function theTime() {
    var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var now = new Date();
    var date = padZero(now.getDate());
    var day = now.getDay();
    var today = dayNames[day];
    var month = padZero(now.getMonth() + 1);

    var hours = padZero(now.getHours());
    var minutes = padZero(now.getMinutes());
      
      //12 hour clock variables
    var ampm = hours >= 12 ? 'PM' : 'AM';  
    var usHours = padZero(hours % 12) || 12;
      
    $datep.html(today + ', ' + month + '/' + date);
    $clock.html(hours + ':' + minutes);
    $usClock.html(usHours + ':' + minutes);
    $usClock.append($('<span>').addClass('ampm').text(ampm));
      
  }
    
// Toggle clock to 12 and 24 hour mode
 $('.time').on('click', function() {
     // get the clock status and store it first
     var visible = $clock.hasClass('hide');
     chrome.storage.sync.set({'visible24': visible});
     
     $clock.toggleClass('hide');
     $usClock.toggleClass('hide');

   });

    
    
  // on page load, check if there is previous text stored
  chrome.storage.sync.get('mainGoal', function(obj) {
    if(obj.mainGoal) {                         // if there is already a stored text, display it
      $('.submittedGoalContainer').css({'display' : 'block', 'opacity' : 1});
      $('#submittedGoal + label > span').text(obj.mainGoal);
    } else {      // otherwise, display the prompt
      $('.goalPrompt').css({'display' : 'block', 'opacity' : 1});
    }
  });
    
    // on page load, check clock status and apply/remove 'hide' class
  chrome.storage.sync.get('visible24', function(obj) {
      if (!obj.visible24) {
          $clock.addClass('hide');
          $usClock.removeClass('hide');
      } else {
          $clock.removeClass('hide');
          $usClock.addClass('hide');
      }
  });
});
