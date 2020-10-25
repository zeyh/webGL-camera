//Todo: ‘Ground Plane’ Grid
//Todo: position your camera in the x,y plane (z=0)
//Todo: Double pendulum
//Todo: Mouse-Drag Rotation of 3D Object usiing quaternion
//Todo: Show 3D World Axes, and some 3D Model Axes
//Todo: More Additional, Separate, jointed assemblies
//Todo: Two Side-by-Side Viewports in a Re-sizable Webpage
//Todo: Perspective Camera AND orthographic Camera
//Todo: View Control

"use strict";

const pendulumFcn = (y) => {
    /* 
        @param: t - t span (max time)
                y - [2.5, 0, 1, 0] //initial condition arr with size of 4
        from: https://www.mathworks.com/matlabcentral/fileexchange/46991-simulating-chaotic-behavior-of-double-pendulum
              https://web.mit.edu/jorloff/www/chaosTalk/double-pendulum/double-pendulum-en.html
        offers an ode function describing double pendulum
    */
    //constants
    let l1=1; 
    let l2=2 ; 
    let m1=2 ; 
    let m2=1; 
    let g=9.8;
    var yprime = [4]; //y_prime=zeros(4,1);

    //equations
    let a = (m1+m2)*l1 ;
    let b = m2*l2*math.cos(y[0]-y[2]);
    let c = m2*l1*math.cos(y[0]-y[2]) ;
    let d = m2*l2;
    let e = -m2*l2*y[3]*y[3]*math.sin(y[0]-y[2])-g*(m1+m2)*math.sin(y[0]) ;
    let f = m2*l1*y[1]*y[1]*math.sin(y[0]-y[2])-m2*g*math.sin(y[2]) ;

    yprime[0] = y[1]; //angular velocity of top rod
    yprime[2] = y[3] ; //angular velocity of bottom rod
    yprime[1] = (e*d-b*f)/(a*d-c*b) ;
    yprime[3] = (a*f-c*e)/(a*d-c*b) ;

    return yprime
}

function RungeKutta(t_final, h, y0){
    /* 
        @param: t - maximal t span
                h - the time steps 
                y - [2.5, 0, 1, 0] //initial condition arr with size of 4
        ref: https://www.youtube.com/watch?v=0LzDiScAcJI
             https://rosettacode.org/wiki/Runge-Kutta_method#Alternate_solution
        trying to use RungeKutta solve system of 1st order ODE in the pendulumFcn() 
    */
    // h = 0.1;
    // t_final = 5;
    let N = math.ceil(t_final/h)
    // let t = [N] //not depend on t for our case
    // t[0] = 0
    // t[1] = t[0] + h

    //init solution array
    let sol0 = []
    for(let i=0; i<N; i++){
        let tmp = [0,0,0,0]
        sol0[i] = tmp;
    }
    sol0[0] =  y0;
    for(let n=0; n<N-1; n++){
        let sol1 = pendulumFcn(sol0[n]); // [k1A, k1B, k1C, k1D] 
        let sol2 = []
        for(let i=0; i<4; i++){
            sol2[i] = sol0[n][i] + h/2*sol1[i];
        }
        sol2 = pendulumFcn(sol2)
        let sol3 = []
        for(let i=0; i<4; i++){
            sol3[i] = sol0[n][i] + h/2*sol2[i];
        }
        sol3 = pendulumFcn(sol3)
        let sol4 = []
        for(let i=0; i<4; i++){
            sol4[i] = sol0[n][i] + h*sol3[i];
        }
        sol4 = pendulumFcn(sol4)
        for(let i=0; i<4; i++){
            sol0[n+1][i] = sol0[n][i] + h/6*(sol1[i] + 2*sol2[i] + 2*sol3[i] + sol4[i]);
        }
    }
    return sol0
}

function solveODE(){
    /*
        if want to convert angle to x,y position:
        % x1=l1*sin(y(:,1)); %first column
        % y1=-l1*cos(y(:,1));
        % x2=l1*sin(y(:,1))+l2*sin(y(:,3)); %third column
        % y2=-l1*cos(y(:,1))-l2*cos(y(:,3));
    */
    let theta1=1.6; //init angle
    let theta1_prime=0;
    let theta2=2.2;
    let theta2_prime=0;
    let y0=[theta1, theta1_prime, theta2, theta2_prime];
    let tspan=50;
    let dt = 0.1;
    let y = RungeKutta(tspan, dt, y0); //the position of movement
    //first column - angle of first bob, third column - angle of the third bob
    let bob1Motion = [y.length]
    let bob2Motion = [y.length]
    for(let i=0; i<y.length; i++){
        bob1Motion[i] = y[i][1]
        bob2Motion[i] = y[i][2]
    }
    console.log(bob1Motion)



}

function main(){
    console.log("I'm in func.js right now...");
    var g_canvas = document.getElementById('webgl');
    var gl = getWebGLContext(g_canvas);
    // pendulum()
    solveODE();
}