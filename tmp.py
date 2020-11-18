def y(x):
    return x*x + 2*x + 1

def main():
    print("x")
    x = []
    h = 3
    x0 = 3
    for i in range(9):
        x.append(x0 + i*3/8)
    print(x)
    result = 0
    for i in range(1,9):
        result += y(x[i])
    print(result*3/8)
    
main()