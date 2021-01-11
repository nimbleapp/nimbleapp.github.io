// Website data
const saveApiVersion = 1;
const MEET_TYPE = {
  GOOGLE : 0,
  CUSTOM : 1,
};

// User data
let doHideWarning = false;
let doPlaySound = false;
let meets = [];

function saveData() {
  localStorage.setItem('save', JSON.stringify({ doHideWarning, doPlaySound, meets, saveApiVersion }));
}

function updateMeetUi() {
  const div = window.meets;
  while (div.children.length !== 0) {
    div.children[0].remove();
  }

  function toMinutes(time) {
    return time[0] * 60 + time[1];
  }

  meets.sort((x1, x2) => toMinutes(x1.time) - toMinutes(x2.time)).forEach((x, i) => {
    const rowElement = document.createElement('div');
    rowElement.className = 'row';

    const colMdAutoElement = document.createElement('div');
    colMdAutoElement.className = 'col-md-auto';

    const textElement = document.createElement('p');
    const [ hours, minutes ] = x.time;
    textElement.innerHTML = `${hours % 12 || 12}:${(minutes <= 9 ? '0' : '') + minutes} ${hours < 12 ? 'A' : 'P'}M - ${x.name} : <i>${x.code}</i>`;

    const colElement = document.createElement('div');
    colElement.className = 'col';

    const imgElement = document.createElement('img');
    imgElement.className = 'trashcan float-right';
    imgElement.src = './res/img/trash.svg';
    imgElement.addEventListener('click', () => {
      meets.splice(i, 1);
      updateMeetUi();
      saveData();
    });

    rowElement.addEventListener('mouseover', () => { imgElement.style.animation = 'fadeIn 0.2s ease-in-out forwards'; });
    rowElement.addEventListener('mouseleave', () => { imgElement.style.animation = 'fadeOut 0.2s ease-in-out forwards'; });

    colMdAutoElement.appendChild(textElement);
    colElement.appendChild(imgElement);
    rowElement.appendChild(colMdAutoElement);
    rowElement.appendChild(colElement);
    div.appendChild(rowElement);
  });
}

window.addEventListener('load', () => {
  function updateVolumeButtonUi() {
    volumeIcon.src = `./res/img/volume${doPlaySound ? '-on' : '-off'}.svg`;
  }
  
  const save = localStorage.getItem('save');
  if (save) {
    const json = JSON.parse(save);

    // Migrates the save json if necessary
    let doLoop = true;
    let didMigrate = false;
    while (doLoop) {
      const apiVersion = json.saveApiVersion || 0;
      if (apiVersion < saveApiVersion) {
        switch (apiVersion) {
          case 0:
            json.meets.forEach((x) => { x.type = MEET_TYPE.GOOGLE; });
            break;
          default:
            break;
        }
  
        json.saveApiVersion = apiVersion + 1;
        didMigrate = true;
      } else {
        doLoop = false;
      }
    }

    ({ doHideWarning, doPlaySound, meets } = json);
    if (didMigrate) {
      saveData();
    }

    updateMeetUi();
    updateVolumeButtonUi();
  }

  if (doHideWarning) {
    permWarning.remove();
  } else {
    permWarning.style.display = 'inherit';

    closeWarningButton.addEventListener('click', () => {
      doHideWarning = true;
      permWarning.remove();
      saveData();
    });
  }

  typeDropdown.addEventListener('change', () => {
    const index = typeDropdown.selectedIndex;
    nameInput.placeholder = `${[ 'Class', 'Site' ][index]} name`;
    codeInput.placeholder = [ 'Code', 'Link' ][index];
  });

  addButton.addEventListener('click', () => {
    const time = timeInput.value.split(':');
    const name = nameInput.value;
    let code = codeInput.value;
    if (time.length === 2 && name && code) {
      const type = MEET_TYPE[typeDropdown.value === 'Google meet' ? 'GOOGLE' : 'CUSTOM'];
      if (type === MEET_TYPE.GOOGLE) {
        code = code.toLowerCase();
      } else if (!code.includes('http://') && !code.includes('https://')) {
        code = `https://${code}`;
      }

      meets.push({
        name,
        code,
        time : time.map((x) => Number(x)),
        type,
      });
      updateMeetUi();
      saveData();

      timeInput.value = null;
      codeInput.value = '';
      nameInput.value = '';
    }
  });

  function playSound() {
    (new Audio('./res/audio/ring.mp3')).play();
  }

  volumeButton.addEventListener('click', () => {
    doPlaySound = !doPlaySound;
    playSound();
    updateVolumeButtonUi();
    saveData();
  });

  function showNotification(message, status) {
    const warning = document.createElement('div');
    warning.className = `alert alert-${status}`;
    warning.innerHTML = message;

    const button = document.createElement('button');
    button.className = 'close';
    button.innerHTML = '<span>&times;</span>';
    button.addEventListener('click', button.parentNode.remove);

    warning.appendChild(button);
    warnings.appendChild(warning);
  }

  function tryPlayingSound() {
    if (doPlaySound) {
      playSound();
    }
  }

  popupButton.addEventListener('click', () => {
    let didGetBlocked = false;
    for (let i = 0; i < 2 && !didGetBlocked; i++) {
      didGetBlocked = !window.open('popup.html');
    }

    if (didGetBlocked) {
      showNotification('Some of the pop-ups were blocked.', 'danger');
    } else {
      showNotification('The pop-ups opened successfully.', 'success');
    }

    tryPlayingSound();
  });

  let lastMinute;
  setInterval(() => {
    const minuteTime = (new Date()).setSeconds(0, 0);
    if (lastMinute !== minuteTime) {
      const date = new Date();
      const currentMeets = meets.filter((x) => x.time[0] === date.getHours() && x.time[1] === date.getMinutes());
      if (currentMeets.map((x) => (x.type === MEET_TYPE.GOOGLE ? `https://g.co/meet/${x.code}` : x.code)).filter((x) => !window.open(x)).forEach((x) => {
        createWarningNotification('The pop-up to your meet was blocked. Allow pop-ups for this website to enable automatic window opening. '
          + `Click <a href=${x} target="_blank">here<a> to join the meet.`, 'danger');
      }));

      if (currentMeets.length !== 0) {
        tryPlayingSound();
      }

      lastMinute = minuteTime;
    }
  }, 1000);
});
