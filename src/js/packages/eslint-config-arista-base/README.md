# Arista Networks ESLint base config including Prettier
This ESLint config is based on AirBnB's base rules with some modifications:

  * https://github.com/airbnb/javascript

## Usage
Just create a `.eslintrc` file in your project with the following contents:

```
{
    "extends": "arista-base"
}
```

and add `"eslint-config-arista-base": "<VERSION>"` to your `package.json` dependencies.
