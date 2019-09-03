# Arista Networks ESLint base JavaScript config
This ESLint config is based on AirBnB's base rules with some modifications for JavaScript code:

  * https://github.com/airbnb/javascript

## Usage
Just create a `.eslintrc` file in your project with the following contents:

```
{
    "extends": "arista-base-js"
}
```

and add `"eslint-config-arista-base-js": "<VERSION>"` to your `package.json` dependencies.
