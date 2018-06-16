jsPsych.plugins["aaron-response"] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('aaron-response', 'stimulus', 'image');

  plugin.info = {
    name: 'aaron-response',
    description: '',
    parameters: {
      label_left: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'label_left',
        default: undefined,
        description: 'The left label to be displayed.'
      },
      label_right: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'label_right',
        default: undefined,
        description: 'The right label to be displayed.'
      },
      target_item: {
        type: jsPsych.plugins.parameterType.IMAGE,
        pretty_name: 'target_item',
        default: undefined,
        description: 'The item to make a decision with.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the stimulus.'
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimulus duration',
        default: null,
        description: 'How long to hide the stimulus.'
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'How long to show trial before it ends.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, trial will end when subject makes a response.'
      },
    }
  }

  let res = null;

  plugin.trial = function(display_element, trial) {
    var coords = [];
    var start_time = ((new Date()).getTime());
    document.onmousemove = handleMouseMove;


    /* Write HTML image elements. */
    var left_label_div = ('<div class="left_label_div"><img src="' + trial.label_left + '" id="stimuli"></img></div>'),
        right_label_div = ('<div class="right_label_div"><img src="' + trial.label_right +'" id="stimuli"></img></div>'),
        item_div = ('<div class="item_div"><img src="' + trial.target_item +'" id="item"></img></div>');

    // Draw
    display_element.innerHTML = trial.prompt+left_label_div+right_label_div+item_div;
    
    // Get mouse coordinates.
    function handleMouseMove(event) {
        var e = window.event;
        coords.push({x: e.clientX, y: e.clientY, time: (((new Date()).getTime()) - start_time)});
    };


    /* 
     * Update the location of the item.
     */
    let currentDroppable = null;
    let stimuli = display_element.querySelector('#item');
    let displayBox = display_element.querySelector('.item_div');
    stimuli.onmousedown = function(event) {

      var shiftX = (event.clientX - stimuli.getBoundingClientRect().left),
          shiftY = (event.clientY - stimuli.getBoundingClientRect().top),
          responseFlag = false;

      stimuli.style.position = 'absolute';
      stimuli.style.zIndex = 1000;
      document.body.append(stimuli);
      document.addEventListener('mousemove', onMouseMove);


      moveAt(event.pageX, event.pageY);
      function moveAt(pageX, pageY) {
        stimuli.style.left = pageX - shiftX + 'px';
        stimuli.style.top = pageY - shiftY + 'px';

        // Trigger label display.
        if (pageY-shiftY <= displayBox.getBoundingClientRect().top) {
          display_element.querySelector('.left_label_div').style.visibility = 'visible';
          display_element.querySelector('.right_label_div').style.visibility = 'visible';
        }
      }


      function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);

        stimuli.hidden = true;
        let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
        stimuli.hidden = false;
        if (!elemBelow) return;

        // If NULL, then we're not on a target area!
        let droppableBelow = setDroppableBelow(elemBelow);
        updateDroppable(droppableBelow);
      }


      function setDroppableBelow(elem) {
        return elem.closest('.left_label_div') || elem.closest('.right_label_div');
      }


      function updateDroppable(dropBelow) {
        if (currentDroppable != dropBelow) {
          if (currentDroppable) {
            currentDroppable.style.background = '';
          }
          currentDroppable = dropBelow;
          if (currentDroppable) {
            currentDroppable.style.background = 'green';
            res = currentDroppable;
            responseFlag = true; // In the area.
          }
        }
      }

      function mouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        if (responseFlag) {
          after_response({
            rt: ((new Date()).getTime()) - start_time,
            key: res.className
          });
        }
      }


      // Records a response only when mouse is lifted.
      stimuli.onmouseup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        // stimuli.onmouseup = null;
        if (responseFlag) {
          var info = {
            rt: ((new Date()).getTime()) - start_time,
            key: res.className
          }
          after_response(info);
        }
      };

    };

    item.ondragstart = function() {
      return false;
    };


    // Store response.
    var response = {
      rt: null,
      key: null
    };  

    // function to end trial when it is time
    var end_trial = function() {
      document.body.removeChild(stimuli);
      jsPsych.pluginAPI.clearAllTimeouts(); // kill any remaining setTimeout handlers

      // gather the data to store for the trial
      var trial_data = {
        "rt": response.rt,
        "label_left": trial.label_left,
        "label_right": trial.label_right,
        "target_item": trial.target_item,
        "response": response.key,
        "mouse_movement": coords
      };

      display_element.innerHTML = ''; // console.log(display_element.innerHTML); // clear the display
      coords = []; // clear the coordinate data
      jsPsych.finishTrial(trial_data); // move on to the next trial
    };

    // function to handle responses by the subject
    var after_response = function(info) {
      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      display_element.querySelector('#stimuli').className += 'responded';

      // only record the first response
      if (response.key == null) {
        response = info;
      }

      if (trial.response_ends_trial) {
        end_trial();
      }
    };

    // hide stimulus if stimulus_duration is set
    if (trial.stimulus_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        display_element.querySelector('#label_left').style.visibility = 'hidden';
        display_element.querySelector('#label_right').style.visibility = 'hidden';
      }, trial.stimulus_duration);
    }

    // end trial if trial_duration is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
      }, trial.trial_duration);
    }
  };
  return plugin;
})();
