function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
      
            // Row 1
            0.17677669, -0.30618623,  0.4330127,  0.3,
            0.4330127,  0.19134171, -0.25,      -0.25,
           -0.30618623, 0.375,       0.35355338, 0,
            0,          0,          0,          1
        
    ]);
    return getTransposeMatrix(transformationMatrix);
}


/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */

function getModelViewMatrix() {
    // Convert degrees to radians
   
      // Step 1: Create the translation matrix
      const translationMatrix = createTranslationMatrix(0.3, -0.25, 0);

      // Step 2: Create the scaling matrix
      const scaleMatrix = createScaleMatrix(0.5, 0.5, 1);
  
      // Step 3: Create the rotation matrices
      const rotationXMatrix = createRotationMatrix_X(Math.PI / 6);  // 30 degrees
      const rotationYMatrix = createRotationMatrix_Y(Math.PI / 4);  // 45 degrees
      const rotationZMatrix = createRotationMatrix_Z(Math.PI / 3);  // 60 degrees
  
      // Step 4: Multiply the matrices in order (scale -> rotate -> translate)
      let resultMatrix = multiplyMatrices(scaleMatrix, rotationXMatrix);
      resultMatrix = multiplyMatrices(resultMatrix, rotationYMatrix);
      resultMatrix = multiplyMatrices(resultMatrix, rotationZMatrix);
      resultMatrix = multiplyMatrices(resultMatrix, translationMatrix);
  
      // Step 5: Return the final transformation matrix
      return new Float32Array(resultMatrix);
}


/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */
function getPeriodicMovement(startTime) {
    // Get the current time
    const currentTime = (Date.now() - startTime) / 1000; // Convert to seconds
    const period = 10; // 10 seconds total period
    const halfPeriod = period / 2; // 5 seconds for each half

    // Calculate the phase in the animation cycle (0 to 1 in the first 5 seconds, 1 to 0 in the next 5 seconds)
    let t = (currentTime % period) / halfPeriod; 

    // If t > 1, we are in the second half (returning to initial position), so reverse the direction
    if (t > 1) {
        t = 2 - t; // Makes t go from 1 to 0
    }

    // Get the initial position (identity matrix) and target position (the result of your transformation)
    const initialMatrix = createIdentityMatrix();
    const targetMatrix = getModelViewMatrix();

    // Interpolate between the initialMatrix and targetMatrix using t (0 means initial, 1 means target)
    const interpolatedMatrix = initialMatrix.map((initialValue, index) => {
        return initialValue * (1 - t) + targetMatrix[index] * t;
    });

    // Return the interpolated matrix for rendering
    return new Float32Array(interpolatedMatrix);
}

