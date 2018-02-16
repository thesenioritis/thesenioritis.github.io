const graduation = moment(new Date("May 31, 2018"));
const today = moment();
const daysLeft = graduation.diff(today, 'days')+1;
let msg = `${daysLeft} days left. Make them count.`;
if (daysLeft == 0) {
  msg = `Today we graduate. Let's make it count.`;
} else if (daysLeft < 0) {
  msg = `Hosted by Thomas Burton and Kevin Huang.`;
}

document.querySelector('.daysLeft').innerHTML = msg;
