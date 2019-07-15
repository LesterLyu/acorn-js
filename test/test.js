const Acorn = require('../index');


async function test() {
    const acorn = new Acorn('lyudishu', 'LVds1995');
    await acorn.login();
    const enrolledCourses = await acorn.course.enrolledCourses();
    console.log(enrolledCourses);
}

test();
