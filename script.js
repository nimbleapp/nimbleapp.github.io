let meets = [];

function updateUi() {
  const div = window.meets;
  for (const element of div.children) {
    element.remove();
  }

  function toMinutes(time) {
    return time[0] * 60 + time[1];
  }

  meets.sort((x1, x2) => toMinutes(x1.time) - toMinutes(x2.time)).forEach((x) => {
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
    imgElement.className = 'float-right'
    imgElement.src = './img/trash.svg';
    imgElement.style.width = '16px';

    colMdAutoElement.appendChild(textElement);
    colElement.appendChild(imgElement);
    rowElement.appendChild(colMdAutoElement);
    rowElement.appendChild(colElement);
    div.appendChild(rowElement);
  });
}

window.addEventListener('load', () => {
  const save = localStorage.getItem('save');
  if (save) {
    meets = JSON.parse(save);
    updateUi();
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
      localStorage.setItem('save', JSON.stringify(meets));
      updateUi();

      timeInput.value = null;
      codeInput.value = '';
      nameInput.value = '';
    }
  });

  setInterval(() => {
    const date = new Date();
    if (date.getSeconds() === 0) {
      meets.filter((x) => x.time[0] === date.getHours() && x.time[1] === date.getMinutes()).forEach((x) => {
        window.open(`https://g.co/meet/${x.code}`);
      });
    }
  }, 1000);
});
