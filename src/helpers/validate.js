export function allPromiseFinish(promiseList) {
  let hasError = false;
  let count = promiseList.length;
  const results = [];

  if (!promiseList.length) {
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    promiseList.forEach((promise, index) => {
      promise
        .catch(e => {
          hasError = true;
          return e;
        })
        .then(result => {
          count -= 1;
          results[index] = result;

          if (count > 0) {
            return;
          }

          if (hasError) {
            reject(results);
          }
          resolve(results);
        });
    });
  });
}



class RuleObj {

}


async function validateRule(
  name,
  value,
  rule,
  options,
  messageVariables,
) {
  
}

/**
 * We use `async-validator` to validate the value.
 * But only check one value in a time to avoid namePath validate issue.
 */
export function validateRules(
  namePath,
  value,
  rules,
  options,
  validateFirst,
  messageVariables,
) {
  const name = namePath.join('.');

  // Fill rule with context
  const filledRules = rules.map(currentRule => {
    const originValidatorFunc = currentRule.validator;

    if (!originValidatorFunc) {
      return currentRule;
    }
    const ruleFunc = new RuleObj(currentRule)
    return ruleFunc;
  });

  // >>>>> Validate by parallel
  const rulePromises = filledRules.map(rule =>
    validateRule(name, value, rule, options, messageVariables),
  );

  // Internal catch error to avoid console error log.
  rulePromises.catch(e => e);

  return rulePromises;
}
