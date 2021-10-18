# Deep `freeze`, `seal` or `preventExtensions` with typescript types

Usage:

1. Install package `npm install deep-lock`
2. Usage:

```
import deepLock from 'deep-lock`

cosnt obj = { x: 1 } // { x: number }
const freezed = deepLock({ x: 1 }) // { readonly x: number }
```
