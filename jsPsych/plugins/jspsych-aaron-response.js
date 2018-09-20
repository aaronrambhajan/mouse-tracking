jsPsych.plugins["aaron-response"] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('aaron-response', 'stimulus', 'image');

  plugin.info = {
    name: 'aaron-response',
    description: '',
    parameters: {
      subject: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'subject',
        default: undefined,
        description: 'Subject ID for the given participant.'
      },
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
      correct_response: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'correct_response',
        default: undefined,
        description: 'The correct response for this trial.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: '',
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


  plugin.trial = function(display_element, trial) {

    var coords = [],
        response = {rt: null, label: null}; 
        start_time = ((new Date()).getTime());

    /* Write HTML image elements. */
    var left_label_div = ('<div class="left_label_div"><img src="' + trial.label_left + '" id="stimuli"></img></div>'),
        right_label_div = ('<div class="right_label_div"><img src="' + trial.label_right +'" id="stimuli"></img></div>'),
        item_div = ('<div class="item_div"><img src="' + trial.target_item +'" id="item"></img></div>');

    display_element.innerHTML = trial.prompt+left_label_div+right_label_div+item_div;
    
    let stimuli = display_element.querySelector('#item'),
        displayBox = display_element.querySelector('.item_div'),
        shiftX, shiftY, res = null;

    document.onmousemove = getMouseCoords;
    stimuli.onmousedown = mouseDown;
    stimuli.onmouseup = mouseUp; 


    // Get mouse coordinates.
    function getMouseCoords(event) {
        var e = window.event;
        coords.push({x: e.clientX, y: e.clientY, time: (((new Date()).getTime()) - start_time)});
    };

    function mouseDown(event) {
      shiftX = (event.clientX - stimuli.getBoundingClientRect().left);
      shiftY = (event.clientY - stimuli.getBoundingClientRect().top);

      stimuli.style.position = 'absolute';
      stimuli.style.zIndex = 1000;
      document.body.append(stimuli);
      document.addEventListener('mousemove', onMouseMove);
      moveAt(event.pageX, event.pageY);
    }

    function moveAt(pageX, pageY) {
      stimuli.style.left = pageX - shiftX + 'px';
      stimuli.style.top = pageY - shiftY + 'px';
    }

    function onMouseMove(event) {
      moveAt(event.pageX, event.pageY);
      var ll_div = display_element.querySelector('.left_label_div'),
          rr_div = display_element.querySelector('.right_label_div');

      // LABEL DISPLAY
      if (event.pageY-shiftY <= displayBox.getBoundingClientRect().top) {
        ll_div.style.visibility = 'visible';
        rr_div.style.visibility = 'visible';
      }

      stimuli.hidden = true;
      let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
      stimuli.hidden = false;
      updateDroppable(elemBelow, ll_div, rr_div);
    }

    function updateDroppable(dropBelow, ll, rr) {
      var elem = dropBelow.closest('.left_label_div') || dropBelow.closest('.right_label_div');

      if (elem == ll) {
        ll.style.background = 'green', rr.style.background = '', res = elem;
      } else if (elem == rr) {
        ll.style.background = '', rr.style.background = 'green', res = elem;
      } else {
        ll.style.background = '', rr.style.background = '', res = null;
      }
    }

    function mouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      if (res) {
        after_response({
          rt: ((new Date()).getTime()) - start_time,
          label: res.className
        });
      }
    }

    item.ondragstart = function() {
      return false;
    };


    // function to end trial when it is time
    var end_trial = function() {
      document.body.removeChild(stimuli);
      jsPsych.pluginAPI.clearAllTimeouts(); // kill any remaining setTimeout handlers

      // gather the data to store for the trials
      var trial_data = {
        "subject": trial.subject,
        "left_label_div": trial.label_left,
        "right_label_div": trial.label_right,
        "target_item": trial.target_item,
        "rt": response.rt,
        "response": response.label,
        "correct": (trial.correct_response == response.label),
        "mouse_movement": coords
      };

      display_element.innerHTML = ''; // clear the display
      coords = []; // clear the coordinate data
      jsPsych.finishTrial(trial_data); // move on to the next trial
    };


    // function to handle responses by the subject
    var after_response = function(info) {
      display_element.querySelector('#stimuli').className += 'responded';

      // only record the first response
      if (response.label == null) {
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
