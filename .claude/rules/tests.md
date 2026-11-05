---
paths:
  - '**/*.spec.ts'
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - '**/test/**'
  - '**/__tests__/**'
---

# Test rules

The test conventions are in `docs/engineering/coding-standards.md` under "Tests". In addition, when an agent writes or changes a test:

- Write it from the contract or the behavior the task describes, before reading the implementation where possible.
- Prove it can fail: break the behavior once, see the test go red, restore it.
- Assert values, not only existence. A mock asserts the arguments it receives, including tenant and ownership scope.
- Never skip, loosen or delete an assertion to get a green run. A flaky test is a defect to report.
- Database-backed tests use an explicit local test database; never point a test at a shared, staging or production database.
