const {parse} = require('node-html-parser');

/**
 * An Error usually represents username or password error.
 */
class LoginError extends Error {
    constructor(...args) {
        super(...args);
    }
}

module.exports = {
    LoginError,

    /**
     * Extract all form data from an html document.
     * @param {string} body - An html document
     * @return {{data: {}, action: string}}
     */
    getFormData: body => {
        const root = parse(body);
        const inputs = root.querySelectorAll('form input');
        const data = {};
        inputs.forEach(input => {
            data[input.attributes.name] = input.attributes.value;
        });
        const action = root.querySelector('form').attributes.action;
        return {data, action};
    },

    /**
     * Parse login error on the login page.
     * i.e. https://idpz.utorauth.utoronto.ca/idp/profile/SAML2/Redirect/SSO?execution=e1s1
     * @param {string} body - An html document
     * @return {LoginError} An Error
     */
    parseAcornLoginError: body => {
        const root = parse(body);
        const p = root.querySelector('p.form-error');
        return new LoginError(p.innerHTML);
    }
};
