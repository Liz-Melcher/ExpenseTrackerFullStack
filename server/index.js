import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//app.use('/api', routes);

// app.use("*", (req, res) => {
//   res.status(404).json({ message: "Not Found" });
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});