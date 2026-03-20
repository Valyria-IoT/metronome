#include <chrono>
#include "metronome.hpp"

using namespace std::chrono;

// Call when entering "learn" mode
	void metronome::start_timing(){
		//init
		m_beat_count = 0;
		for ( int j=0; j < beat_samples; j++){
			m_beats[j]=0;
			}
		m_timing = true;
	}
	
	// Call when leaving "learn" mode
	void metronome::stop_timing(){
		m_timing = false;
	}

	// Should only record the current time when timing
	// Insert the time at the next free position of m_beats
	void metronome::tap(){
		if (is_timing()){
			milliseconds ms = duration_cast< milliseconds >(
				system_clock::now().time_since_epoch());
			
			m_beats[m_beat_count% beat_samples]=ms.count();
			m_beat_count++;
		}
	}

	// Calculate the BPM from the deltas between m_beats
	// Return 0 if there are not enough samples
	size_t metronome::get_bpm() const{
		auto res =0;
		if (m_beat_count < beat_samples) 
			res= 0;
		else{
			int sum =0;
			int start = m_beat_count % beat_samples;
			for (int i = 0; i < beat_samples - 1; i++) {
				int t1 = m_beats[(start + i) % beat_samples];
				int t2 = m_beats[(start + i + 1) % beat_samples];
				sum += t2 - t1;
			}
			auto avg=sum/(beat_samples-1);
			res= 60000/avg;
		}
		return res;
			
			
	}
