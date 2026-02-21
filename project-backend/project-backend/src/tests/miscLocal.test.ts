import { clear } from 'console';
import { pwdHash } from '../helper';
beforeEach(() => {
  clear();
});
describe('pwdHashing testing', () => {
  test('Not string', () => {
    expect(pwdHash(undefined)).toStrictEqual('');
  });
});
