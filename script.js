let doHideWarning = false;
let doPlaySound = false;
let meets = [];

function saveData() {
  localStorage.setItem('save', JSON.stringify({ doHideWarning, doPlaySound, meets }));
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
      updateUi();
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

window.addEventListener('load', () => {
  const save = localStorage.getItem('save');
  if (save) {
    const json = JSON.parse(save);
    doHideWarning = json.doHideWarning;
    doPlaySound = json.doPlaySound;
    meets = json.meets;

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
    })
  }

  addButton.addEventListener('click', () => {
    const time = timeInput.value.split(':');
    const name = nameInput.value;
    const code = codeInput.value;
    if (time.length === 2 && name && code) {
      meets.push({
        name,
        code : code.toLowerCase(),
        time : time.map((x) => Number(x)),
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
    updateVolumeButtonUi();
    saveData();
  });

  setInterval(() => {
    const date = new Date();
    if (date.getSeconds() === 0) {
      meets.filter((x) => x.time[0] === date.getHours() && x.time[1] === date.getMinutes()).forEach((x) => {
        window.open(`https://g.co/meet/${x.code}`);
        if (doPlaySound) {
          (new Audio('./sounds/ring.mp3')).play();
        }
      });
    }
  }, 1000);
});
