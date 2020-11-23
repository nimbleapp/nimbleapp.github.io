// Website data
const saveApiVersion = 1;
const MEET_TYPE = {
  'GOOGLE' : 0,
  'CUSTOM' : 1,
};

// User data
let doHideWarning = false;
let doPlaySound = false;
let meets = [];

function migrateSaveJson(json) {
  let doLoop = true;
  while (doLoop) {
    const apiVersion = json.saveApiVersion || 0;
    if (apiVersion < saveApiVersion) {
      switch(apiVersion) {
        case 0: json.meets.forEach((x) => { x.type = MEET_TYPE.GOOGLE; }); break;
        default: break;
      }
      json.saveApiVersion = apiVersion + 1;
    } else {
      doLoop = false;
    }
  }
  saveData();
}

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
    textElement.innerHTML = `${hours % 12 || 12}:${(minutes < 9 ? '0' : '') + minutes} ${hours < 12 ? 'A' : 'P'}M - ${x.name} : <i>${x.code}</i>`;

    const colElement = document.createElement('div');
    colElement.className = 'col';

    const imgElement = document.createElement('img');
    imgElement.className = 'trashcan float-right'
    imgElement.src = './img/trash.svg';
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

function updateVolumeButtonUi() {
  volumeIcon.src = `./img/volume${doPlaySound ? 'On' : 'Off'}.svg`;
}

function playSound() {
  (new Audio('./sounds/ring.mp3')).play();
}

window.addEventListener('load', () => {
  const save = localStorage.getItem('save');
  if (save) {
    const json = JSON.parse(save);
    // Migrates the save json if necessary
    migrateSaveJson(json);
    ({ doHideWarning, doPlaySound, meets } = json);

    updateMeetUi();
    updateVolumeButtonUi();
  }

  if (doHideWarning) {
    permWarning.remove();
  } else {
    closeWarningButton.addEventListener('click', () => {
      doHideWarning = true;
      permWarning.remove();
      saveData();
    });
  }

  typeDropdown.addEventListener('change', () => { codeInput.placeholder = typeDropdown.value === 'Google meet' ? 'Code' : 'Link'; });

  addButton.addEventListener('click', () => {
    const time = timeInput.value.split(':');
    const name = nameInput.value;
    let code = codeInput.value;
    if (time.length === 2 && name && code) {
      const type = MEET_TYPE[typeDropdown.value === 'Google meet' ? 'GOOGLE' : 'CUSTOM'];
      switch (type) {
        case MEET_TYPE.GOOGLE: code = code.toLowerCase(); break;
        case MEET_TYPE.CUSTOM:
          if (!code.includes('http://') && !code.includes('https://')) {
            code = `https://${code}`;
          }
          break;
        default: throw new Error();
      }
      if (type === MEET_TYPE.GOOGLE) {
        code = code.toLowerCase();
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

  volumeButton.addEventListener('click', () => {
    doPlaySound = !doPlaySound;
    playSound();
    updateVolumeButtonUi();
    saveData();
  });

  setInterval(() => {
    const date = new Date();
    if (date.getSeconds() === 0) {
      const currentMeets = meets.filter((x) => x.time[0] === date.getHours() && x.time[1] === date.getMinutes());
      if (currentMeets.map((x) => {
        switch (x.type) {
          case MEET_TYPE.GOOGLE: return `https://g.co/meet/${x.code}`;
          case MEET_TYPE.CUSTOM: return x.code;
          default: throw new Error();
        }
      }).filter((x) => !window.open(x)).forEach((x) => {
        const warning = document.createElement('div');
        warning.className = 'alert alert-danger';
        warning.innerHTML = `The popup to your meet was blocked. Allow popups for this website to enable automatic window opening. ` +
          `Click <a href=${x} target="_blank">here<a> to join the meet.`;

        const button = document.createElement('button');
        button.className = 'close';
        button.innerHTML = '<span>&times;</span>';
        button.addEventListener('click', () => button.parentNode.remove());

        warning.appendChild(button);
        warnings.appendChild(warning);
      }));

      if (currentMeets.length !== 0 && doPlaySound) {
        playSound();
      }
    }
  }, 1000);
});
