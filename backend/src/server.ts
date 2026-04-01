import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 6000;

app.get('/health', (req, res) => {
	res.send('OK');
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
