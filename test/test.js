const Acorn = require('../index');

console.log(process.env.acornUserName, process.env.acornPassword);
async function test() {
    const acorn = new Acorn(process.env.acornUserName, process.env.acornPassword);
    await acorn.login();
    const enrolledCourses = await acorn.course.enrolledCourses(0);
    console.log(enrolledCourses);
}

test();
