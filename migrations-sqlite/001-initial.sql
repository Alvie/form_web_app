-- Up  
CREATE TABLE Forms 
  ( 
     id           VARCHAR(16) PRIMARY KEY, 
     answerStruct TEXT, 
     jsonLocation VARCHAR(45) 
  ); 

CREATE TABLE Answers 
  ( 
     id     CHAR(16) PRIMARY KEY, 
     answer TEXT, 
     formId VARCHAR(16), 
     FOREIGN KEY (formId) REFERENCES Forms(id) 
  ); 

INSERT INTO Forms 
VALUES      ('example', 
             '{ "name": "", "quest": "", "col": "", "velo": "", "lord": "", "langs": [""] }', 
             'forms/example.json'); 

-- Down  
DROP TABLE Forms; 

DROP TABLE Answers; 