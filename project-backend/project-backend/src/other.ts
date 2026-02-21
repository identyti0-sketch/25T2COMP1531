import { saveData, getData, clearAllTimeout } from './dataStore';
/** clear function
 * Reset the state of the application back to the start
 * @returns empty object
 */
function clear() {
  const data = getData();

  data.games = {};
  data.userData.length = 0;
  data.quizData.length = 0;
  for (const prop of Object.getOwnPropertyNames(data.sessions)) {
    delete data.sessions[prop];
  }
  clearAllTimeout();
  data.nextUserId = 0;
  saveData();
  return {};
}

export { clear };
