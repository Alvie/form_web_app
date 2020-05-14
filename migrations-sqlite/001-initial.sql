-- Up

CREATE TABLE Forms (
  id            CHAR(16) PRIMARY KEY,
  urlLocation   VARCHAR(16),
  jsonLocation VARCHAR(45)
);

CREATE TABLE Answers (
  id    CHAR(16) PRIMARY KEY,
  answer    TEXT,
  formId CHAR(16),
  FOREIGN KEY (formId) REFERENCES Forms(id)
);

INSERT INTO Forms VALUES ('example000000000', 'example','forms/example.json');

-- Down

DROP TABLE Forms;
DROP TABLE Answers;