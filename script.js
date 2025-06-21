 // Navigation functionality
        function showSection(sectionName) {
            // Hide all sections
            const sections = document.querySelectorAll('.section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            document.getElementById(sectionName).classList.add('active');
            
            // Update navigation active state
            const navLinks = document.querySelectorAll('.nav-links a');
            navLinks.forEach(link => link.classList.remove('active'));
            event.target.classList.add('active');
        }

        // Music Player Class
        class MusicPlayer {
            constructor() {
                // Audio element
                this.audio = document.getElementById('audio-player');
                
                // Control elements
                this.playPauseBtn = document.getElementById('play-pause-btn');
                this.prevBtn = document.getElementById('prev-btn');
                this.nextBtn = document.getElementById('next-btn');
                this.muteBtn = document.getElementById('mute-btn');
                this.shuffleBtn = document.getElementById('shuffle-btn');
                this.repeatBtn = document.getElementById('repeat-btn');
                
                // Display elements
                this.songTitle = document.getElementById('song-title');
                this.songArtist = document.getElementById('song-artist');
                this.currentTime = document.getElementById('current-time');
                this.totalTime = document.getElementById('total-time');
                this.albumImage = document.getElementById('album-image');
                
                // Progress elements
                this.progressBar = document.getElementById('progress-bar');
                this.progressFill = document.getElementById('progress-fill');
                this.progressHandle = document.getElementById('progress-handle');
                
                // Volume elements
                this.volumeSlider = document.getElementById('volume-slider');
                this.volumeDisplay = document.getElementById('volume-display');
                
                // Playlist elements
                this.playlist = document.getElementById('playlist');
                
                // Upload elements
                this.fileInput = document.getElementById('file-input');
                this.uploadBtn = document.getElementById('upload-btn');
                this.urlBtn = document.getElementById('url-btn');
                this.urlModal = document.getElementById('url-modal');
                this.urlInput = document.getElementById('url-input');
                this.addUrlBtn = document.getElementById('add-url');
                this.cancelUrlBtn = document.getElementById('cancel-url');
                this.closeModalBtn = document.getElementById('close-modal');
                
                // State elements
                this.loadingIndicator = document.getElementById('loading-indicator');
                this.errorMessage = document.getElementById('error-message');
                this.errorText = document.getElementById('error-text');
                
                // Player state
                this.currentSongIndex = 0;
                this.songs = [];
                this.isPlaying = false;
                this.isShuffle = false;
                this.repeatMode = 'none'; // 'none', 'one', 'all'
                this.isDragging = false;
                this.previousVolume = 0.7;
                
                // Initialize player
                this.init();
            }
            
            init() {
                // Set initial volume
                this.audio.volume = 0.7;
                this.volumeSlider.value = 70;
                
                // Add event listeners
                this.addEventListeners();
                
                // Load default empty state
                this.updateDisplay();
                
                console.log('Music Player initialized');
            }
            
            addEventListeners() {
                // Control buttons
                this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
                this.prevBtn.addEventListener('click', () => this.previousSong());
                this.nextBtn.addEventListener('click', () => this.nextSong());
                this.muteBtn.addEventListener('click', () => this.toggleMute());
                this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
                this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
                
                // Progress bar events
                this.progressBar.addEventListener('click', (e) => this.seekTo(e));
                this.progressHandle.addEventListener('mousedown', (e) => this.startDragging(e));
                document.addEventListener('mousemove', (e) => this.dragProgress(e));
                document.addEventListener('mouseup', () => this.stopDragging());
                
                // Volume control
                this.volumeSlider.addEventListener('input', (e) => this.changeVolume(e));
                
                // Audio events
                this.audio.addEventListener('loadstart', () => this.showLoading());
                this.audio.addEventListener('canplay', () => this.hideLoading());
                this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
                this.audio.addEventListener('timeupdate', () => this.updateProgress());
                this.audio.addEventListener('ended', () => this.handleSongEnd());
                this.audio.addEventListener('error', (e) => this.handleError(e));
                
                // File upload
                this.uploadBtn.addEventListener('click', () => this.fileInput.click());
                this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
                
                // URL input
                this.urlBtn.addEventListener('click', () => this.showUrlModal());
                this.addUrlBtn.addEventListener('click', () => this.handleUrlAdd());
                this.cancelUrlBtn.addEventListener('click', () => this.hideUrlModal());
                this.closeModalBtn.addEventListener('click', () => this.hideUrlModal());
                this.urlModal.addEventListener('click', (e) => {
                    if (e.target === this.urlModal) this.hideUrlModal();
                });
                this.urlInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.handleUrlAdd();
                });
                
                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => this.handleKeyboard(e));
            }
            
            // File upload handling
            handleFileUpload(event) {
                const files = Array.from(event.target.files);
                
                files.forEach((file, index) => {
                    if (file.type.startsWith('audio/')) {
                        const url = URL.createObjectURL(file);
                        const song = {
                            title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
                            artist: 'Unknown Artist',
                            src: url,
                            duration: 0,
                            file: file
                        };
                        
                        this.songs.push(song);
                        
                        // Get audio metadata
                        const tempAudio = new Audio(url);
                        tempAudio.addEventListener('loadedmetadata', () => {
                            song.duration = tempAudio.duration;
                            this.updatePlaylist();
                            
                            // If this is the first song, load it
                            if (this.songs.length === 1) {
                                this.loadSong(0);
                            }
                        });
                    }
                });
                
                // Clear the file input
                event.target.value = '';
            }
            
            // URL Modal Functions
            showUrlModal() {
                this.urlModal.style.display = 'flex';
                this.urlInput.focus();
            }
            
            hideUrlModal() {
                this.urlModal.style.display = 'none';
                this.urlInput.value = '';
            }
            
            handleUrlAdd() {
                const url = this.urlInput.value.trim();
                
                if (!url) {
                    this.showError('Please enter a valid URL');
                    return;
                }
                
                // Basic URL validation
                try {
                    new URL(url);
                } catch (e) {
                    this.showError('Please enter a valid URL');
                    return;
                }
                
                this.addSongFromUrl(url);
                this.hideUrlModal();
            }
            
            addSongFromUrl(url) {
                // Extract filename from URL for title
                const urlParts = url.split('/');
                const filename = urlParts[urlParts.length - 1];
                const title = filename.includes('.') ? 
                    filename.substring(0, filename.lastIndexOf('.')) : 
                    filename || 'Online Song';
                
                const song = {
                    title: title,
                    artist: 'Online Source',
                    src: url,
                    duration: 0,
                    isUrl: true
                };
                
                this.songs.push(song);
                
                // Test the audio URL to get duration
                const tempAudio = new Audio(url);
                tempAudio.addEventListener('loadedmetadata', () => {
                    song.duration = tempAudio.duration;
                    this.updatePlaylist();
                    
                    // If this is the first song, load it
                    if (this.songs.length === 1) {
                        this.loadSong(0);
                    }
                });
                
                tempAudio.addEventListener('error', () => {
                    // Remove the song if it fails to load
                    const index = this.songs.indexOf(song);
                    if (index > -1) {
                        this.songs.splice(index, 1);
                        this.updatePlaylist();
                    }
                    this.showError('Failed to load audio from URL. Please check if the URL is a direct link to an audio file.');
                });
                
                // Trigger metadata loading
                tempAudio.preload = 'metadata';
                tempAudio.load();
            }
            
            // Playlist management
            updatePlaylist() {
                this.playlist.innerHTML = '';
                
                if (this.songs.length === 0) {
                    this.playlist.innerHTML = `
                        <div class="playlist-item empty-state">
                            <h4>No songs loaded</h4>
                            <p>Click "Add Songs" to upload files or "Add from URL" for online songs</p>
                        </div>
                    `;
                    return;
                }
                
                this.songs.forEach((song, index) => {
                    const item = document.createElement('div');
                    item.className = `playlist-item ${index === this.currentSongIndex ? 'active' : ''}`;
                    item.innerHTML = `
                        <h4>${song.title}</h4>
                        <p>${song.artist} • ${this.formatTime(song.duration)}</p>
                    `;
                    item.addEventListener('click', () => this.loadSong(index));
                    this.playlist.appendChild(item);
                });
            }
            
            // Song loading and playback
            loadSong(index) {
                if (index < 0 || index >= this.songs.length) return;
                
                this.currentSongIndex = index;
                const song = this.songs[index];
                
                this.audio.src = song.src;
                this.updateDisplay();
                this.updatePlaylist();
                
                // Reset progress
                this.progressFill.style.width = '0%';
                this.progressHandle.style.left = '0%';
            }
            
            togglePlayPause() {
                if (this.songs.length === 0) {
                    this.showError('No songs to play. Please add audio files first.');
                    return;
                }
                
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            }
            
            play() {
                if (this.songs.length === 0) return;
                
                const playPromise = this.audio.play();
                
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            this.isPlaying = true;
                            this.updatePlayButton();
                            this.albumImage.parentElement.classList.add('playing');
                        })
                        .catch((error) => {
                            console.error('Play failed:', error);
                            this.showError('Failed to play audio. The file may be corrupted or unsupported.');
                        });
                }
            }
            
            pause() {
                this.audio.pause();
                this.isPlaying = false;
                this.updatePlayButton();
                this.albumImage.parentElement.classList.remove('playing');
            }
            
            previousSong() {
                if (this.songs.length === 0) return;
                
                let newIndex;
                if (this.isShuffle) {
                    newIndex = Math.floor(Math.random() * this.songs.length);
                } else {
                    newIndex = this.currentSongIndex - 1;
                    if (newIndex < 0) {
                        newIndex = this.songs.length - 1;
                    }
                }
                
                this.loadSong(newIndex);
                if (this.isPlaying) {
                    this.play();
                }
            }
            
            nextSong() {
                if (this.songs.length === 0) return;
                
                let newIndex;
                if (this.isShuffle) {
                    newIndex = Math.floor(Math.random() * this.songs.length);
                } else {
                    newIndex = this.currentSongIndex + 1;
                    if (newIndex >= this.songs.length) {
                        newIndex = 0;
                    }
                }
                
                this.loadSong(newIndex);
                if (this.isPlaying) {
                    this.play();
                }
            }
            
            handleSongEnd() {
                if (this.repeatMode === 'one') {
                    this.audio.currentTime = 0;
                    this.play();
                } else if (this.repeatMode === 'all' || this.currentSongIndex < this.songs.length - 1) {
                    this.nextSong();
                } else {
                    this.isPlaying = false;
                    this.updatePlayButton();
                    this.albumImage.parentElement.classList.remove('playing');
                }
            }
            
            // Progress bar handling
            updateProgress() {
                if (this.isDragging) return;
                
                const progress = (this.audio.currentTime / this.audio.duration) * 100;
                this.progressFill.style.width = `${progress}%`;
                this.progressHandle.style.left = `${progress}%`;
                
                this.currentTime.textContent = this.formatTime(this.audio.currentTime);
            }
            
            updateDuration() {
                this.totalTime.textContent = this.formatTime(this.audio.duration);
            }
            
            seekTo(event) {
                if (this.songs.length === 0 || !this.audio.duration) return;
                
                const rect = this.progressBar.getBoundingClientRect();
                const percent = (event.clientX - rect.left) / rect.width;
                const newTime = percent * this.audio.duration;
                
                this.audio.currentTime = Math.max(0, Math.min(newTime, this.audio.duration));
            }
            
            startDragging(event) {
                this.isDragging = true;
                this.dragProgress(event);
            }
            
            dragProgress(event) {
                if (!this.isDragging || this.songs.length === 0 || !this.audio.duration) return;
                
                const rect = this.progressBar.getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
                
                this.progressFill.style.width = `${percent * 100}%`;
                this.progressHandle.style.left = `${percent * 100}%`;
                
                const newTime = percent * this.audio.duration;
                this.currentTime.textContent = this.formatTime(newTime);
            }
            
            stopDragging() {
                if (!this.isDragging) return;
                
                this.isDragging = false;
                
                if (this.songs.length > 0 && this.audio.duration) {
                    const percent = parseFloat(this.progressFill.style.width) / 100;
                    const newTime = percent * this.audio.duration;
                    this.audio.currentTime = Math.max(0, Math.min(newTime, this.audio.duration));
                }
            }
            
            // Volume control
            changeVolume(event) {
                const volume = event.target.value / 100;
                this.audio.volume = volume;
                this.volumeDisplay.textContent = `${event.target.value}%`;
                
                // Update mute button icon
                this.updateVolumeIcon();
                
                if (volume > 0) {
                    this.previousVolume = volume;
                }
            }
            
            toggleMute() {
                if (this.audio.volume > 0) {
                    this.previousVolume = this.audio.volume;
                    this.audio.volume = 0;
                    this.volumeSlider.value = 0;
                    this.volumeDisplay.textContent = '0%';
                } else {
                    this.audio.volume = this.previousVolume;
                    this.volumeSlider.value = this.previousVolume * 100;
                    this.volumeDisplay.textContent = `${Math.round(this.previousVolume * 100)}%`;
                }
                
                this.updateVolumeIcon();
            }
            
            updateVolumeIcon() {
                const icon = this.muteBtn.querySelector('i');
                const volume = this.audio.volume;
                
                if (volume === 0) {
                    icon.className = 'fas fa-volume-mute';
                } else if (volume < 0.5) {
                    icon.className = 'fas fa-volume-down';
                } else {
                    icon.className = 'fas fa-volume-up';
                }
            }
            
            // Shuffle and repeat
            toggleShuffle() {
                this.isShuffle = !this.isShuffle;
                this.shuffleBtn.classList.toggle('active', this.isShuffle);
            }
            
            toggleRepeat() {
                const modes = ['none', 'all', 'one'];
                const currentIndex = modes.indexOf(this.repeatMode);
                this.repeatMode = modes[(currentIndex + 1) % modes.length];
                
                const icon = this.repeatBtn.querySelector('i');
                this.repeatBtn.classList.remove('active');
                
                switch (this.repeatMode) {
                    case 'all':
                        icon.className = 'fas fa-repeat';
                        this.repeatBtn.classList.add('active');
                        break;
                    case 'one':
                        icon.className = 'fas fa-repeat';
                        this.repeatBtn.classList.add('active');
                        // Add a "1" indicator
                        this.repeatBtn.innerHTML = '<i class="fas fa-repeat"></i> 1';
                        break;
                    default:
                        icon.className = 'fas fa-repeat';
                        this.repeatBtn.innerHTML = '<i class="fas fa-repeat"></i> Repeat';
                }
            }
            
            // Display updates
            updateDisplay() {
                if (this.songs.length === 0) {
                    this.songTitle.textContent = 'Select a song to play';
                    this.songArtist.textContent = 'Unknown Artist';
                    this.currentTime.textContent = '0:00';
                    this.totalTime.textContent = '0:00';
                    return;
                }
                
                const song = this.songs[this.currentSongIndex];
                this.songTitle.textContent = song.title;
                this.songArtist.textContent = song.artist;
            }
            
            updatePlayButton() {
                const icon = this.playPauseBtn.querySelector('i');
                icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
            }
            
            // Utility functions
            formatTime(seconds) {
                if (isNaN(seconds) || seconds === Infinity) return '0:00';
                
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = Math.floor(seconds % 60);
                return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
            
            
            // Loading and error states
            showLoading() {
                this.loadingIndicator.style.display = 'block';
                this.hideError();
            }
            
            hideLoading() {
                this.loadingIndicator.style.display = 'none';
            }
            
            showError(message) {
                this.errorText.textContent = message;
                this.errorMessage.style.display = 'block';
                this.hideLoading();
                
                // Auto-hide error after 5 seconds
                setTimeout(() => {
                    this.hideError();
                }, 5000);
            }
            
            hideError() {
                this.errorMessage.style.display = 'none';
            }
            
            handleError(event) {
                console.error('Audio error:', event);
                
                let errorMessage = 'Error loading audio file';
                if (this.audio.error) {
                    switch (this.audio.error.code) {
                        case 1:
                            errorMessage = 'Audio loading was aborted';
                            break;
                        case 2:
                            errorMessage = 'Network error occurred while loading audio';
                            break;
                        case 3:
                            errorMessage = 'Audio file is corrupted or unsupported format';
                            break;
                        case 4:
                            errorMessage = 'Audio format is not supported by your browser';
                            break;
                        default:
                            errorMessage = 'Unknown audio error occurred';
                    }
                }
                
                this.showError(errorMessage);
            }
            
            handleKeyboard(event) {
                // Only handle keyboard shortcuts when not typing in inputs
                if (event.target.tagName === 'INPUT') return;
                
                switch (event.code) {
                    case 'Space':
                        event.preventDefault();
                        this.togglePlayPause();
                        break;
                    case 'ArrowLeft':
                        event.preventDefault();
                        this.previousSong();
                        break;
                    case 'ArrowRight':
                        event.preventDefault();
                        this.nextSong();
                        break;
                    case 'KeyM':
                        event.preventDefault();
                        this.toggleMute();
                        break;
                    case 'KeyS':
                        event.preventDefault();
                        this.toggleShuffle();
                        break;
                    case 'KeyR':
                        event.preventDefault();
                        this.toggleRepeat();
                        break;
                }
            }
        }

        // Initialize the music player when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            new MusicPlayer();
        });
    