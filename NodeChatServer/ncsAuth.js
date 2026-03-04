import bcrypt from 'bcrypt';
import { insertUser } from './ncsRepo.js'

export class authMsg {
    constructor() {
        this.success = false;
        this.error = "";
    }
}

export async function registerUser(username, password) {
    const response = new authMsg();
    const hash = await bcrypt.hash(password, 10);
    try {
        insertUser(username, hash);
        response.success = true;
    } catch (e) {
        response.error = "ALIAS_TAKEN";
    }
    return response;
}

export async function loginUser(username, password) {
    const response = new authMsg();
    const user = getUser(username);
    if (!user) response.error = "USER_NOT_FOUND";
    else {
        const match = await bcrypt.compare(password, user.password_hash);
        if(match) response.success = true;
        else response.error = "INVALID_CREDENTIALS";
    }
    return response;
}