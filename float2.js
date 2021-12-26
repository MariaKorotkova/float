let readline = require('readline-sync');

let changeSymbol = (str, index, symbol) => {
    let newStr = '';

    for (let i = 0; i < str.length; i++)
        if (i !== index)
            newStr += str[i];
        else
            newStr += symbol;

    return newStr;
}

let toNormalize = (number) => {
    while (number.int !== '1') {
        if (number.int.startsWith('1')) {
            number.float = number.int[number.int.length - 1] + number.float;
            number.float = number.float.substr(0, 23);
            number.int = number.int.substr(0, number.int.length - 1);
            number.power++;
        } else if (number.int.startsWith('0')) {
            number.int = number.float[0];
            number.float = number.float.substr(1, number.float.length - 1) + '0';
            number.power--;
        }
    }

    for (let i = number.float.length; i < 23; i++)
        number.float += '0';

    if (number.float > 23)
        number.float = number.float.substr(0, 23);
}

let toConvert = number => {
    switch (number.toString()) {
        case '+infinity': {
            return '01111111100000000000000000000000';
        }
        case '-infinity': {
            return '11111111100000000000000000000000';
        }
        case 'NaN': {
            return '01111111100000000000000000000001';
        }
        case '0': {
            return '00000000000000000000000000000000';
        }
        default: {
            let translatedNumber = Number(Math.abs(number)).toString(2);

            let translated = {
                int: translatedNumber.indexOf('.') !== -1 ? translatedNumber.substr(0, translatedNumber.indexOf('.')) : translatedNumber,
                float: translatedNumber.indexOf('.') !== -1 ? translatedNumber.substr(translatedNumber.indexOf('.') + 1) : '00000000000000000000000',
                power: 0
            };

            if (number > 0)
                translated.sgn = '0'
            else
                translated.sgn = '1';

            toNormalize(translated);

            translated.power += 127;
            translated.power = translated.power.toString(2);

            for (let i = translated.power.length; i < 8; i++)
                translated.power = '0' + translated.power;

            return translated.sgn + translated.power + translated.float;
        }
    }
}

let translateFloat = number => {
    let power = -1;
    let num = 0;

    for (let i = 0; i < number.length; i++) {
        if (number[i] === '1')
            num += Math.pow(2, power);

        power--;
    }

    return num;
}

let toHuman = (number) => {
    switch (number.toString()) {
        case '01111111100000000000000000000000': {
            return '+infinity';
        }
        case '11111111100000000000000000000000': {
            return '-infinity';
        }
        case '01111111100000000000000000000001': {
            return NaN;
        }
        case '00000000000000000000000000000000': {
            return 0;
        }
        default: {
            let numberInfo = {
                sgn: number[0],
                power: parseInt(number.slice(1, 9), 2) - 127,
                int: '1',
                float: number.slice(9, number.length)
            }

            while (numberInfo.power !== 0) {
                if (numberInfo.power < 0) {
                    numberInfo.float = numberInfo.int + numberInfo.float;
                    numberInfo.float = numberInfo.float.substr(0, numberInfo.float.length - 1);
                    numberInfo.int = '0';
                    numberInfo.power++;
                } else {
                    numberInfo.int += numberInfo.float[0];
                    numberInfo.float = numberInfo.float.substr(1, numberInfo.float.length - 1);
                    numberInfo.power--;
                }
            }

            return (parseInt(numberInfo.int, 2) + translateFloat(numberInfo.float)) * (Number(numberInfo.sgn) === 1 ? -1 : 1);
        }
    }
}

let alignNum = (num1, num2) => {
    if (num1.length > num2.length)
        num2 = '0' + num2;
    else if (num1.length < num2.length)
        num1 = '0' + num1;

    return {
        number1: num1,
        number2: num2
    }
}

let sumOperation = (number1, number2) => {
    let result = '';

    if (number1.length < number2.length) {
        let x = number2;
        number2 = number1;
        number1 = x;
    }

    number1 = alignNum(number1, number2).number1.split('').reverse().join('');
    number2 = alignNum(number1, number2).number2.split('').reverse().join('');

    for (let i = 0; i < number2.length; i++) {
        number2 = alignNum(number1.split('').reverse().join(''), number2.split('').reverse().join('')).number2.split('').reverse().join('');

        let curSum = (Number(number1[i]) + Number(number2[i])).toString(2);

        result = curSum[curSum.length - 1] + result;

        if (curSum.length === 2) {
            let isDo = false;

            let length = number1.length;

            for (let j = i + 1; j < length; j++) {
                if (number1[j] === '1')
                    number1 = changeSymbol(number1, j, '0');
                else if (number1[j] === '0') {
                    number1 = changeSymbol(number1, j, '1');
                    isDo = true;
                    break;
                }
            }

            if (!isDo)
                number1 = number1 + '1';

            if (curSum.length === 2 && i === number2.length - 1)
                result = curSum[0] + result;
        }
    }

    return result;
}

let toggle = char => char === '1' ? '0' : '1';

let inverse = string => {
    let newStr = '';

    for (let i = 0; i < string.length; i++)
        newStr += toggle(string[i]);

    return newStr;
}

let subtraction = (number1, number2) => {
    if (number1 === '0' && number2 === '1')
        return number2;

    number1 = alignNum(number1, number2).number1;
    number2 = alignNum(number1, number2).number2;

    if (number1.length !== number2.length && number1 === '0' && number2 === '1')
        return '1';

    number2 = sumOperation(inverse(number2), '1');
    let result = sumOperation(number1, number2);
    result = result.substr(1, result.length - 1);

    return result;
}

let getInfo = number => ({
    sgn: Number(number[0]),
    power: number.slice(1, 9),
    int: '1',
    float: number.substr(9, 23)
});

let sum = (number1, number2) => {
    if (number1 === '01111111100000000000000000000001' || number2 === '01111111100000000000000000000001')
        return '01111111100000000000000000000001';

    let numInfo1 = getInfo(number1);
    let numInfo2 = getInfo(number2);

    numInfo1.power = parseInt(numInfo1.power,2) - 127;
    numInfo2.power = parseInt(numInfo2.power,2) - 127;

    let summa = {};

    if (numInfo1.power > numInfo2.power)
        summa.sgn = numInfo1.sgn;
    else
        summa.sgn = numInfo2.sgn;

    while (numInfo1.power !== numInfo2.power) {
        if (numInfo1.power < numInfo2.power) {
            numInfo1.float = numInfo1.int + numInfo1.float;
            numInfo1.float = numInfo1.float.substr(0, 23);
            numInfo1.int = '0';

            numInfo1.power++;
        } else {
            numInfo2.float = numInfo2.int + numInfo2.float;
            numInfo2.float = numInfo2.float.substr(0, 23);
            numInfo2.int = '0';

            numInfo2.power++;
        }
    }

    summa.power = numInfo1.power;

    if (numInfo1.sgn === numInfo2.sgn) {
        summa.int = sumOperation(numInfo1.int, numInfo2.int);
        summa.float = sumOperation(numInfo1.float, numInfo2.float);

        while (summa.float.length > 23) {
            summa.int = sumOperation(summa.int, summa.float[0]);
            summa.float = summa.float.substr(1, summa.float.length - 1);
        }
    } else {
        let first = numInfo1.int + numInfo1.float;
        let second = numInfo2.int + numInfo2.float;
        let result;

        if (parseInt(first, 2) - parseInt(second, 2) > 0)
            result = subtraction(first, second);
        else if (parseInt(second, 2) - parseInt(first, 2) > 0)
            result = subtraction(second, first);
        else
            result = subtraction(second, first);

        if (result.length <= 23) {
            summa.int = '0';
            summa.float = result;
        } else {
            summa.int = result[0];
            summa.float = result.substr(1, result.length - 1);
        }

        while (summa.float.length > 23) {
            summa.int = sumOperation(summa.int, summa.float[0]);
            summa.float = summa.float.substr(1, summa.float.length - 1);
        }
    }

    if (summa.int === '0' && summa.float === '00000000000000000000000') {
        return '0' + '00000000' + summa.float;
    } else {
        toNormalize(summa);

        summa.power = (summa.power + 127).toString(2);

        for (let i = summa.power.length; i < 8; i++)
            summa.power = '0' + summa.power;

        return summa.sgn + summa.power + summa.float;
    }
}

//Основная программа 

console.log('Выберите: ');
console.log('1: перевести число');
console.log('2: сложить два числа');
let choice = readline.question('> ');

switch (choice) {
    case '1': {
        console.log('Введите число: ');
        let number = readline.question('> ');

        let convertedNum;

        if (number.toString().toLowerCase() !== '+infinity' && number.toString() !== '-infinity')
            convertedNum = toConvert(Number(number));
        else
            convertedNum = toConvert(number.toLowerCase());

        console.log(convertedNum);

        console.log('Перевести обратно? (Yes/No)')
        let answer = readline.question('> ').toLowerCase();

        if (answer === 'yes')
            console.log(toHuman(convertedNum));

        break;
    }
    case '2': {
        console.log('Введите первое число: ');
        let number1 = readline.question('> ');

        console.log('Введите второе число: ');
        let number2 = readline.question('> ');

        if (number1.toString().toLowerCase() !== '+infinity' && number1.toString() !== '-infinity')
            number1 = toConvert(Number(number1));
        else
            number1 = toConvert(number1.toLowerCase());

        if (number2.toString().toLowerCase() !== '+infinity' && number2.toString() !== '-infinity')
            number2 = toConvert(Number(number2));
        else
            number2 = toConvert(number2.toLowerCase());

        let result = sum(number1, number2);

        console.log(`${number1} + ${number2} = ${result} (${toHuman(result)})`);

        break;
    }
    default: {
        console.log('Выберите существующий пункт');
        break;
    }
}