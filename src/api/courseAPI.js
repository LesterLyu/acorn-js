const rp = require('request-promise-native');

/**
 * Course API.
 */
class CourseAPI {
    constructor(acorn) {
        this.acorn = acorn;
    }

    /**
     * @private
     * @returns {*}
     */
    get cookieJar() {
        return this.acorn.cookieJar;
    }

    /**
     * Eligible registrations. This is retrieved after user logged in.
     * i.e. 2019-2020 Fall-Winter is a registration; 2019 Summer is a separate registration.
     * Fall and Winter registration could be separated, based on campus.
     * @readonly
     * @returns {Registration[]|null}
     */
    get registrations() {
        return this.acorn.registrations;
    }

    /**
     * Get enrolled courses.
     * @param {number} [registrationIndex=0] - The index of registrations.
     * @returns {Promise<object>} - Enrolled courses, The server response.
     */
    async enrolledCourses(registrationIndex = 0) {
        const params = this.registrations[registrationIndex].registrationParams;
        return await rp.get({
            uri: 'https://acorn.utoronto.ca/sws/rest/enrolment/course/enrolled-courses',
            qs: params,
            jar: this.cookieJar,
            json: true,
        });
    }

    /**
     * Get courses in enrollment cart.
     * @param {number} [registrationIndex=0] - The index of registrations.
     * @returns {Promise<object>} - Courses in enrollment cart, The server response.
     */
    async enrollmentCart(registrationIndex = 0) {
        const params = this.registrations[registrationIndex].registrationParams;
        return await rp.get({
            uri: 'https://acorn.utoronto.ca/sws/rest/enrolment/plan',
            qs: {
                candidacyPostCode: params.candidacyPostCode,
                candidacySessionCode: params.candidacySessionCode,
                sessionCode: params.sessionCode
            },
            jar: this.cookieJar,
            json: true,
        });
    }

    /**
     * Enrol a course.
     * @param {number} [registrationIndex=0] - The index of registrations.
     * @param {string} code - Course code, i.e. "CSC108H1", the last two chars "H1" is required.
     * @param {string} session - Course session, i.e. "F", "S", "Y".
     * @param {string} section - Course section, i.e. "LEC,0101". The comma between "LEC" and "0101" is required.
     * @returns {Promise<object>} - The server response.
     */
    async enroll(registrationIndex = 0, code, session, section) {
        if (arguments.length === 3) {
            registrationIndex = 0;
            [code, session, section] = arguments;
        }
        const data = {
            activeCourse: {
                course: {
                    code,
                    sectionCode: session.toUpperCase(),
                    primaryTeachMethod: "LEC",
                    enrolled: "false"
                },
                lecture: {
                    sectionNo: section.toUpperCase()
                },
                tutorial: {},
                practical: {}
            },
            eligRegParams: this.registrations[registrationIndex].registrationParams
        };

    }
}

module.exports = {CourseAPI};
