# Arista Networks ESLint config
This ESLint config is based on AirBnB's rules with some modifications:

  * https://github.com/airbnb/javascript

## Usage
Just create a `.eslintrc` file in your project with the following contents:

```
{
    "extends": "arista"
}
```

and add `"eslint-config-arista": "<VERSION>"` to your `package.json` dependencies.
