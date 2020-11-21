const meets = [];

function updateUi() {
  const div = window.meets;
  for (const element of div.children) {
    element.remove();
  }

  function toMinutes(time) {
    return time[0] * 60 + time[1];
  }

  meets.sort((x1, x2) => toMinutes(x1[0]) - toMinutes(x2[0])).forEach((x) => {
    const element = document.createElement('p');
    const hours = x[0][0];
    element.innerHTML = `${hours % 12 || 12}:${x[0][1]} ${hours < 12 ? 'A' : 'P'}M - ${x[1]} : ${x[2]}`;
    div.appendChild(element);
  });
}

window.addEventListener('load', () => {
  addButton.addEventListener('click', () => {
    const time = timeInput.value.split(':');
    const code = codeInput.value;
    const name = nameInput.value;
    if (time.length === 2 && code && name) {
      meets.push([ time.map((x) => Number(x)), code, name]);
      updateUi();

      timeInput.value = null;
      codeInput.value = '';
      nameInput.value = '';
    }
  });
});
