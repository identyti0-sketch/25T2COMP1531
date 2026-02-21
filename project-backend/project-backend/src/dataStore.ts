import { Data, IdTimeout } from './interface';
import fs from 'fs';
let data:Data = {
  userData: [],
  quizData: [],
  games: {},
  sessions: {},
  nextUserId: 0
};

let timeouts: IdTimeout = {};

// YOU MAY MODIFY THIS OBJECT ABOVE

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1

/*
Example usage
  let store = getData()
  console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

  store.names.pop() // Removes the last name from the names array
  store.names.push('Jake') // Adds 'Jake' to the end of the names array

  console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
*/

// Use getData() to access the data

function getData(): Data {
  if (fs.existsSync('./src/dataStorage.json')) {
    data = JSON.parse(fs.readFileSync('./src/dataStorage.json', 'utf-8'));
    // Defensive defaults
    if (!data.userData) data.userData = [];
    if (!data.quizData) data.quizData = [];
    if (!data.games || typeof data.games !== 'object') data.games = {};
    if (!data.sessions) data.sessions = {};
    if (!data.nextUserId) data.nextUserId = 0;
  } else {
    fs.writeFileSync('./src/dataStorage.json', JSON.stringify(data),
      { encoding: 'utf8', flag: 'w' });
  }
  return data;
}

function saveData() {
  fs.writeFileSync('./src/dataStorage.json', JSON.stringify(data, null, 2),
    { encoding: 'utf8', flag: 'w' });
}

function getTimeout() {
  return timeouts;
}

function clearAllTimeout() {
  Object.values(timeouts).forEach(i => {
    clearTimeout(i);
  });
  timeouts = {};
}

export { getData, saveData, getTimeout, clearAllTimeout };
