import serenaWaiting from './serena-waiting.json';
import serenaWorking from './serena-working.json';

const waitBlob = new Blob([JSON.stringify(serenaWaiting)], { type: 'application/json' });
const serenaWaitUrl = URL.createObjectURL(waitBlob);

const workBlob = new Blob([JSON.stringify(serenaWorking)], { type: 'application/json' });
const serenaWorkUrl = URL.createObjectURL(workBlob);

export {
  serenaWaitUrl,
  serenaWorkUrl,
};
