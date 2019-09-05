const Acorn = require('../index');

console.log(process.env.acornUserName, process.env.acornPassword);
async function test() {
    const acorn = new Acorn(process.env.acornUserName, process.env.acornPassword);
    await acorn.login();
    const enrolledCourses = await acorn.course.enrolledCourses();
    console.log(enrolledCourses);
    console.log(await acorn.course.courseDetail("CSC420H1", "20199", "F"));
}

test();
