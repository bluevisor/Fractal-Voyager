import { FractalType } from './types';

export const DEFAULT_FRACTAL_STATE = {
  center: { x: -0.5, y: 0.0 },
  zoom: 1.0,
  iterations: 100,
  type: FractalType.MANDELBROT,
  colorOffset: 0.0,
};

// Vertex Shader (Simple Full-screen Quad)
export const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Fragment Shader
export const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_zoom;
uniform int u_iterations;
uniform int u_type; // 0: Mandelbrot, 1: Julia, 2: Burning Ship
uniform float u_color_offset;

vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);
    return a + b*cos( 6.28318*(c*t+d+u_color_offset) );
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    // Coordinate transformation
    vec2 c = u_center + uv / u_zoom;
    vec2 z = c;
    
    // Julia set constant (visualize different Julia sets by creating variation if needed, or fixed)
    vec2 juliaC = vec2(-0.8, 0.156);

    // Initial conditions based on type
    if (u_type == 0) { // Mandelbrot
        z = vec2(0.0);
    } else if (u_type == 1) { // Julia
        c = juliaC; // Fixed C for Julia, z is the pixel coordinate
    } else if (u_type == 2) { // Burning Ship
        z = vec2(0.0);
    }

    float iter = 0.0;
    float maxIter = float(u_iterations);
    
    for (float i = 0.0; i < 1000.0; i++) {
        if (i >= maxIter) break;
        
        if (u_type == 2) {
            // Burning Ship: z = (|Re(z)| + i|Im(z)|)^2 + c
            z = vec2(abs(z.x), abs(z.y));
        }

        // z = z^2 + c
        // (x + iy)^2 = x^2 - y^2 + 2ixy
        float x = (z.x * z.x - z.y * z.y) + c.x;
        float y = (2.0 * z.x * z.y) + c.y;
        
        if (x*x + y*y > 4.0) {
            iter = i;
            break;
        }
        
        z.x = x;
        z.y = y;
        iter = i;
    }

    if (iter == maxIter) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        // Smooth coloring
        float log_zn = log(z.x*z.x + z.y*z.y) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        iter = iter + 1.0 - nu;

        vec3 col = palette(iter * 0.05);
        gl_FragColor = vec4(col, 1.0);
    }
}
`;

export const FRACTAL_TYPE_MAP: Record<FractalType, number> = {
  [FractalType.MANDELBROT]: 0,
  [FractalType.JULIA]: 1,
  [FractalType.BURNING_SHIP]: 2,
};
